import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform,
  ScrollView,
  // Image, // No longer directly used for avatar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus, Video, ResizeMode, AVPlaybackStatus as VideoAVPlaybackStatus } from 'expo-av'; // Added Video, ResizeMode, VideoAVPlaybackStatus
import { Colors } from '../../../constants/Colors';
import { 
  getConversationHistory, 
  endConversation,
  processTextViaSocket // Ensure this is updated to handle new parameters from backend
} from '../../../api/services/public/aiCharacters';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useSocket } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';

interface Message {
  sender: 'user' | 'ai';
  content: string;
  videoUrl?: string; // This was for a different video concept, can be removed if not used
  audioUrl?: string;
  timestamp: string;
  speechSegments?: Array<{ type: 'speech' | 'silence'; start: number; end: number }>; // Optional: if you store them per message
  audioDuration?: number; // Optional: if you store them per message
}

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  profileImage: string; // Still used for fallback or if video fails to load
}

interface Conversation {
  _id: string;
  characterId: AICharacter;
  messages: Message[];
  callType: 'video';
}

// --- Video Asset Configuration ---
// IMPORTANT: Replace with your actual video URL and segment timings
const CHARACTER_VIDEO_URL = 'YOUR_CHARACTER_LOOP_VIDEO.mp4'; // e.g., require('../../../assets/videos/character_loop.mp4') or a remote URL
const VIDEO_SEGMENTS = {
  TALKING: { start: 0, end: 5000 },   // Milliseconds: e.g., 0s to 5s is talking animation
  IDLE: { start: 5000, end: 7000 },    // Milliseconds: e.g., 5s to 7s is idle/blink animation
  // Add more segments if needed, e.g., LISTENING, THINKING
};
// --- End Video Asset Configuration ---

interface SpeechSegment {
  type: 'speech' | 'silence';
  start: number;
  end: number;
}

export default function AIVideoCallScreen() {
  const { id: routeConversationId } = useLocalSearchParams<{ id: string }>();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayingAudioUrl, setCurrentPlayingAudioUrl] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState('00:00'); // For AI audio duration

  // Video State and Refs
  const videoRef = useRef<Video>(null);
  const [currentVideoSegment, setCurrentVideoSegment] = useState<'TALKING' | 'IDLE'>('IDLE');
  const speechSegmentsRef = useRef<SpeechSegment[] | null>(null);
  const audioDurationRef = useRef<number | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const cleanupSocketListenersRef = useRef<(() => void) | null>(null);

  const speechResultListenerRef = useRef<any>(null);
  const speechErrorListenerRef = useRef<any>(null);
  const recordingTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConversation(routeConversationId);
    
    Audio.requestPermissionsAsync().then(({ granted }) => {
      if (!granted) Alert.alert('Microphone Permission Required', '...');
    });
    
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false, // Important for video calls
      shouldDuckAndroid: true,
      // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX, // Consider this
      // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX, // Consider this
    });
    
    return () => {
      // Cleanup speech recognition
      if (speechResultListenerRef.current) speechResultListenerRef.current.remove();
      if (speechErrorListenerRef.current) speechErrorListenerRef.current.remove();
      if (recordingTimeoutIdRef.current) clearTimeout(recordingTimeoutIdRef.current);
      if (isRecording) ExpoSpeechRecognitionModule.stop(); else ExpoSpeechRecognitionModule.abort();
      
      sound?.unloadAsync();
      videoRef.current?.unloadAsync(); // Unload video
      if (cleanupSocketListenersRef.current) cleanupSocketListenersRef.current();
    };
  }, [routeConversationId]);
  
  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > 0) {
      scrollToBottom();
    }
  }, [conversation?.messages]);

  // --- Video Control Functions ---
  const playVideoSegment = async (segmentType: 'TALKING' | 'IDLE', shouldPlayInitially = true) => {
    if (!videoRef.current) return;
    const segment = VIDEO_SEGMENTS[segmentType];
    try {
      // console.log(`[Video] Setting segment: ${segmentType} (${segment.start}ms), Play: ${shouldPlayInitially}`);
      await videoRef.current.setStatusAsync({
        positionMillis: segment.start,
        shouldPlay: shouldPlayInitially,
      });
      setCurrentVideoSegment(segmentType);
    } catch (e) {
      console.error(`[Video] Error setting segment ${segmentType}:`, e);
    }
  };

  const onVideoStatusUpdate = (status: VideoAVPlaybackStatus) => {
    if (!status.isLoaded || !videoRef.current) {
      if (status.error) console.error("[Video] Playback Error:", status.error);
      return;
    }

    const segmentTimes = VIDEO_SEGMENTS[currentVideoSegment];
    if (status.isPlaying && status.positionMillis >= segmentTimes.end) {
      // Loop current segment
      videoRef.current.setPositionAsync(segmentTimes.start).catch(e => console.warn("[Video] Loop setPositionAsync error:", e));
    }
    
    // If video somehow stops when it shouldn't (e.g. during AI speech)
    if (!status.isPlaying && isPlayingAudio && currentVideoSegment === 'TALKING') {
        // console.log("[Video] Detected unexpected stop during TALKING, attempting to resume segment.");
        // videoRef.current.playFromPositionAsync(segmentTimes.start).catch(e => console.warn("[Video] Resume segment error:", e));
    }
  };
  // --- End Video Control Functions ---
  
  const loadConversation = async (convId: string) => {
    try {
      setLoading(true);
      const data = await getConversationHistory(convId);
      setConversation(data);
      // Set initial video state to IDLE and not playing until first audio
      if (videoRef.current) {
        playVideoSegment('IDLE', false); 
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load conversation.');
      setLoading(false);
    }
  };
  
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };
  
  const formatTime = (timeInMillis: number) => {
    if (isNaN(timeInMillis) || timeInMillis < 0) return '00:00';
    const totalSeconds = Math.floor(timeInMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const updateTimer = (status: AVPlaybackStatus) => {
    if (status && status.isLoaded && !status.didJustFinish && status.durationMillis && status.positionMillis) {
      const remaining = status.durationMillis - status.positionMillis;
      setRemainingTime(formatTime(remaining));
    }
  };

  const determineVideoSegmentBasedOnAudioTime = (audioPositionMs: number): 'TALKING' | 'IDLE' => {
    if (!speechSegmentsRef.current || speechSegmentsRef.current.length === 0) {
      return 'TALKING'; // Default to talking if no segments (or make it IDLE if preferred)
    }
    for (const segment of speechSegmentsRef.current) {
      if (audioPositionMs >= segment.start && audioPositionMs < segment.end) {
        return segment.type === 'speech' ? 'TALKING' : 'IDLE';
      }
    }
    // If outside all segments, assume silence/idle (e.g. after last segment)
    return 'IDLE'; 
  };
  
  const playOrPauseAudio = async (audioUrlToPlay: string) => {
    if (sound && currentPlayingAudioUrl === audioUrlToPlay && isPlayingAudio) { // Pausing current
      await sound.pauseAsync();
      setIsPlayingAudio(false);
      playVideoSegment('IDLE', true); // Character idle when paused
    } else { // Playing new, resuming paused, or playing a different audio
      if (sound) await sound.unloadAsync();
      setSound(null); 
      setIsPlayingAudio(false);
      setCurrentPlayingAudioUrl(null);
      setRemainingTime("00:00"); 
      speechSegmentsRef.current = null; // Clear previous segments

      // Try to find message specific segments if passed during load or from socket
      const messageWithAudio = conversation?.messages.find(m => m.audioUrl === audioUrlToPlay);
      if (messageWithAudio?.speechSegments) {
        speechSegmentsRef.current = messageWithAudio.speechSegments;
        if(messageWithAudio.audioDuration) audioDurationRef.current = messageWithAudio.audioDuration;
      }


      try {
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: audioUrlToPlay },
          { shouldPlay: true }
        );
        setSound(newSound); 
        setIsPlayingAudio(true);
        setCurrentPlayingAudioUrl(audioUrlToPlay);
        
        // Initial video state based on whether segments are immediately available
        // If segments are known, the status update will quickly correct this
        playVideoSegment(speechSegmentsRef.current ? determineVideoSegmentBasedOnAudioTime(0) : 'TALKING', true);

        newSound.setOnPlaybackStatusUpdate((playbackStatus: AVPlaybackStatus) => {
          if (!playbackStatus.isLoaded) {
            if (currentPlayingAudioUrl === audioUrlToPlay) { // Check if this callback is for the active sound
              setIsPlayingAudio(false);
              setCurrentPlayingAudioUrl(null);
              setRemainingTime("00:00");
              setSound(null); 
              speechSegmentsRef.current = null;
              playVideoSegment('IDLE', true); // Character idle if audio fails/unloads
              if (playbackStatus.error) console.error(`[Audio] Playback error:`, playbackStatus.error);
            }
            return;
          }

          updateTimer(playbackStatus); 

          // Video synchronization based on audio playback position and speech segments
          const newVideoSegment = determineVideoSegmentBasedOnAudioTime(playbackStatus.positionMillis);
          if (newVideoSegment !== currentVideoSegment) {
            playVideoSegment(newVideoSegment, true);
          }
          
          // Ensure video is playing if audio is playing and segment is TALKING
          if (playbackStatus.isPlaying && newVideoSegment === 'TALKING' && videoRef.current) {
            videoRef.current.getStatusAsync().then(videoStatus => {
              if (videoStatus.isLoaded && !videoStatus.isPlaying) {
                // console.log("[Video Sync] Audio playing, TALKING segment, video was paused. Resuming video.");
                videoRef.current?.playAsync();
              }
            });
          }


          if (playbackStatus.didJustFinish) {
            if (currentPlayingAudioUrl === audioUrlToPlay) {
              setIsPlayingAudio(false);
              setCurrentPlayingAudioUrl(null);
              setRemainingTime("00:00");
              setSound(null); 
              speechSegmentsRef.current = null;
              playVideoSegment('IDLE', true); // Character idle when audio finishes
            }
            newSound.unloadAsync().catch(e => console.warn(`[Audio] Error unloading sound on finish:`, e));
          }
        });

        if (status.isLoaded && status.durationMillis) {
          setRemainingTime(formatTime(status.durationMillis));
          audioDurationRef.current = status.durationMillis; // Store actual duration
        } else {
          setRemainingTime("00:00"); 
        }

      } catch (e: any) {
        console.error(`[Audio] Error creating or playing audio:`, e);
        Alert.alert('Audio Playback Error', `Could not play audio: ${e.message || 'Unknown error'}`);
        if (sound) await sound.unloadAsync().catch(() => {}); 
        setSound(null);
        setIsPlayingAudio(false);
        setCurrentPlayingAudioUrl(null);
        setRemainingTime("00:00");
        speechSegmentsRef.current = null;
        playVideoSegment('IDLE', true); // Character idle on error
      }
    }
  };
  
  const cleanupSpeechRecognition = () => {
    speechResultListenerRef.current?.remove(); speechResultListenerRef.current = null;
    speechErrorListenerRef.current?.remove(); speechErrorListenerRef.current = null;
    if (recordingTimeoutIdRef.current) clearTimeout(recordingTimeoutIdRef.current); recordingTimeoutIdRef.current = null;
  };

  const startRecording = async () => {
    try {
      if (sound && isPlayingAudio) {
        await sound.stopAsync(); 
        setIsPlayingAudio(false);
        setCurrentPlayingAudioUrl(null);
        setSound(null); 
        setRemainingTime("00:00");
        speechSegmentsRef.current = null;
        playVideoSegment('IDLE', true); // Go to idle when user starts speaking
      }
      
      const { granted: micPermission } = await Audio.requestPermissionsAsync();
      if (!micPermission) { Alert.alert('Microphone Permission Required', '...'); return; }
      
      const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPermission.granted) { Alert.alert('Speech Recognition Permission Required', '...'); return; }

      setIsRecording(true); 
      playVideoSegment('IDLE', true); // Or a "LISTENING" segment if you have one
      cleanupSpeechRecognition();

      ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false, continuous: false, iosTaskHint: 'unspecified' });
      
      speechResultListenerRef.current = ExpoSpeechRecognitionModule.addListener('result', (event) => {
        if (event.results && event.results.length > 0 && event.isFinal) {
          const transcribedText = event.results[0].transcript;
          cleanupSpeechRecognition();
          setIsRecording(false); 
          playVideoSegment('IDLE', true); // Back to idle after user finishes speaking
          if (transcribedText && transcribedText.trim() !== '') {
            processTranscribedText(transcribedText);
          } else {
            console.log("[Speech] Empty result.");
          }
        }
      });
      
      speechErrorListenerRef.current = ExpoSpeechRecognitionModule.addListener('error', (event) => {
        console.error('[Speech] Error:', event.error, event.message);
        cleanupSpeechRecognition();
        setIsRecording(false);
        playVideoSegment('IDLE', true); // Back to idle on error
        // ... (existing error alert logic) ...
         if (event.error !== 'no-speech' && event.error !== 'canceled') { // Avoid alert for these
            Alert.alert('Speech Error', `Speech recognition failed: ${event.message || event.error || 'Unknown error'}`);
        }
      });
      
      recordingTimeoutIdRef.current = setTimeout(() => {
        if (isRecording) { // Check current state
          stopRecording(); 
        }
      }, 10000);

    } catch (err) {
      console.error('[Speech] Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start speech recognition.');
      setIsRecording(false);
      playVideoSegment('IDLE', true);
      cleanupSpeechRecognition();
    }
  };
  
  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      ExpoSpeechRecognitionModule.stop();
      // Listeners will handle setIsRecording(false) and video state
    } catch (err) {
      console.error('[Speech] Failed to stop module:', err);
      setIsRecording(false); // Fallback
      playVideoSegment('IDLE', true); // Fallback
      cleanupSpeechRecognition(); // Fallback
    }
  };
  
  const processTranscribedText = async (text: string) => {
    if (!conversation?._id || !user?.id || !socket) {
      Alert.alert("Error", "Cannot process request. Missing details."); return;
    }

    setIsProcessing(true);
    setProcessingStatus('Starting...');
    playVideoSegment('IDLE', true); // Character can be idle/thinking while processing

    const userMessageTimestamp = new Date().toISOString();
    setConversation(prevConv => ({
      ...prevConv!,
      messages: [
        ...(prevConv!.messages),
        { sender: 'user', content: text, timestamp: userMessageTimestamp }
      ]
    }));

    if (cleanupSocketListenersRef.current) cleanupSocketListenersRef.current();

    cleanupSocketListenersRef.current = processTextViaSocket(
      socket,
      {
        userId: user.id,
        characterId: conversation.characterId._id,
        conversationId: conversation._id,
        userText: text,
        language: 'en-US', // Or from character settings
      },
      {
        onTextResponse: (aiResponse, updatedConvId) => {
          setProcessingStatus('AI responded. Waiting for audio...');
          setConversation(prevConv => {
            if (!prevConv) return null;
            const aiMessageExists = prevConv.messages.some(m => m.sender === 'ai' && m.content === aiResponse);
            if (!aiMessageExists) {
                return {
                    ...prevConv,
                    _id: updatedConvId, // conversationId might change if it was a new one
                    messages: [
                        ...prevConv.messages,
                        { sender: 'ai', content: aiResponse, timestamp: new Date().toISOString() }
                    ]
                };
            }
            return {...prevConv, _id: updatedConvId };
          });
        },
        onStatusUpdate: (status, message) => {
          setProcessingStatus(`${status}: ${message}`);
        },
        // IMPORTANT: Ensure your processTextViaSocket provides these new parameters
        onAudioComplete: (audioUrl, completedConvId, finalAiResponse, speechSegmentsData, audioDurationMs) => {
          setProcessingStatus('Audio ready!');
          setIsProcessing(false);
          speechSegmentsRef.current = speechSegmentsData || null; // Store received segments
          audioDurationRef.current = audioDurationMs || null;    // Store received duration
          
          setConversation(prevConv => {
            if (!prevConv) return null;
            let messageUpdated = false;
            const newMessages = prevConv.messages.map(msg => {
              if (msg.sender === 'ai' && msg.content === finalAiResponse && !msg.audioUrl) {
                messageUpdated = true;
                return { ...msg, audioUrl: audioUrl, speechSegments: speechSegmentsData, audioDuration: audioDurationMs };
              }
              return msg;
            });
            
            if (!messageUpdated) { // Fallback: if AI message wasn't added by onTextResponse or matched
                 const lastUserMsg = newMessages.filter(m => m.sender ==='user').pop();
                 // Ensure it's in response to the last user utterance that triggered this flow
                 if (lastUserMsg && lastUserMsg.content === text) { 
                     newMessages.push({ 
                         sender: 'ai', 
                         content: finalAiResponse, 
                         audioUrl: audioUrl, 
                         timestamp: new Date().toISOString(),
                         speechSegments: speechSegmentsData, 
                         audioDuration: audioDurationMs 
                    });
                 }
            }
            return { ...prevConv, _id: completedConvId, messages: newMessages };
          });

          if (audioDurationMs) {
            setRemainingTime(formatTime(audioDurationMs)); // Set timer based on received duration
          }
          playOrPauseAudio(audioUrl); // Automatically play the AI's audio (and synced video)
        },
        onError: (error) => {
          setProcessingStatus(`Error: ${error.message}`);
          setIsProcessing(false);
          playVideoSegment('IDLE', true); // Back to idle on error
          Alert.alert('Processing Error', error.message);
        }
      }
    );
  };
  
  const handleEndCall = async () => {
    if(sound) await sound.stopAsync(); // Stop audio
    videoRef.current?.stopAsync(); // Stop video
    try {
      if (conversation) await endConversation(conversation._id);
      router.back();
    } catch (err) {
      console.error('Error ending call:', err);
      router.back(); // Still go back
    }
  };
  
  if (loading) { /* ... loading UI ... */ 
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Setting up your call...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !conversation) { /* ... error UI ... */ 
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error || 'Conversation not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadConversation(routeConversationId)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  const characterName = conversation.characterId?.name || 'AI';

  return (
    <>
    <Stack.Screen options={{ title: `Call with ${characterName}`, headerShown: true }} />
    <SafeAreaView style={styles.container}>
      <View style={styles.headerControls}>
        <TouchableOpacity style={styles.closeButton} onPress={() => handleEndCall()}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.timerText}>{remainingTime}</Text>
        {/* Placeholder for other controls like speed, if any */}
      </View>

      {/* Character Video Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Video
            ref={videoRef}
            style={styles.characterAvatar}
            source={{ uri: CHARACTER_VIDEO_URL }} // Or use: require('path_to_local_video.mp4')
            isMuted={true} // Mute character video's own sound
            shouldPlay={false} // Controlled by audio sync logic
            resizeMode={ResizeMode.COVER}
            onPlaybackStatusUpdate={onVideoStatusUpdate}
            onError={(err) => console.error("[Video] Load/Playback Error:", err)}
            onLoad={() => {
                console.log("[Video] Loaded. Setting initial segment to IDLE, not playing.");
                playVideoSegment('IDLE', false);
            }}
          />
          {/* Fallback if video fails or for loading state - optional */}
          {/* { !videoRef.current && conversation.characterId.profileImage && (
            <Image source={{ uri: conversation.characterId.profileImage }} style={styles.characterAvatar} />
          )} */}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressItem}>
            <View style={currentVideoSegment === 'TALKING' && isPlayingAudio ? [styles.progressDot, styles.activeDot] : styles.progressDot} />
            <Text style={styles.progressLabel}>Lecture</Text>
          </View>
          <View style={styles.progressItem}>
            <View style={isRecording ? [styles.progressDot, styles.activeDot] : styles.progressDot} />
            <Text style={styles.progressLabelInactive}>Practice</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {conversation.messages.map((message, index) => (
          <View 
            key={index}
            style={[
              styles.messageContainer,
              message.sender === 'user' ? styles.userMessage : styles.aiMessage
            ]}
          >
             <View style={styles.messageTextContainer}>
                {message.sender === 'ai' ? (
                  <View style={styles.aiMessageContent}>
                    <Text style={styles.aiMessageText}>{message.content}</Text>
                    <View style={styles.aiMessageControls}>
                      {message.audioUrl && (
                        <TouchableOpacity 
                          style={styles.audioPlayerButton}
                          onPress={() => playOrPauseAudio(message.audioUrl!)}
                        >
                          <Ionicons 
                            name={isPlayingAudio && currentPlayingAudioUrl === message.audioUrl ? "pause-circle-outline" : "play-circle-outline"}
                            size={28} 
                            color={Colors.light.primary} 
                          />
                        </TouchableOpacity>
                      )}
                      {/* <TouchableOpacity style={styles.translateButton}>
                        <Ionicons name="language-outline" size={20} color={Colors.light.primary} />
                      </TouchableOpacity> */}
                    </View>
                  </View>
                ) : (
                  <View style={styles.userMessageContent}>
                    <Text style={styles.userMessageText}>{message.content}</Text>
                  </View>
                )}
              </View>
          </View>
        ))}
        
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator color={Colors.light.primary} size="small" />
            <Text style={styles.processingText}>{processingStatus || 'Processing...'}</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputControls}>
        <TouchableOpacity
          style={[ styles.recordButton, isRecording ? styles.recordingButton : null ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing} // Disable mic while AI is processing/generating response
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A', 
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E3A8A', // Match container or make it distinct
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', // Lighter for better visibility
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // Reduced padding
    backgroundColor: '#1E3A8A', // Match container
  },
  avatarContainer: { // Styles for the video container
    width: 150, // Adjust as needed
    height: 150, // Adjust as needed
    borderRadius: 75, // Make it circular if desired
    overflow: 'hidden', // Important for borderRadius with Video
    backgroundColor: 'rgba(255,255,255,0.1)', // Placeholder BG for video
    marginBottom: 15,
  },
  characterAvatar: { // Styles for the Video component itself
    width: '100%',
    height: '100%',
  },
  // Removed characterAvatarPlaceholder and playIconOverlay as Video is now primary
  progressContainer: {
    flexDirection: 'row',
    marginTop: 0, // Reduced margin
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  progressDot: {
    width: 10, // Slightly smaller
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: 'white',
  },
  progressLabel: {
    color: 'white',
    fontSize: 15, // Slightly smaller
    fontWeight: '600',
  },
  progressLabelInactive: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'white', // Changed for chat area
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 70, // Ensure space for input controls
  },
  messageContainer: {
    marginBottom: 12, // Reduced margin
    maxWidth: '85%', // Slightly wider
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  messageTextContainer: {
    borderRadius: 18, // Slightly more rounded
    overflow: 'hidden', // Keep for rounded corners on content
  },
  aiMessageContent: {
    backgroundColor: '#E9E9EB', // Light grey for AI messages
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: 'column',
  },
  aiMessageControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align controls to the right if needed
    alignItems: 'center',
    marginTop: 8,
  },
  audioPlayerButton: {
    marginRight: 8, 
  },
  userMessageContent: {
    backgroundColor: Colors.light.primary, // Your primary color for user messages
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  aiMessageText: {
    fontSize: 16,
    color: '#2C2C2E', // Darker text for AI
  },
  userMessageText: {
    fontSize: 16,
    color: 'white',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 12,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.03)', // Lighter processing indicator
    borderRadius: 12,
  },
  processingText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.light.secondary, // Use secondary color
  },
  inputControls: {
    position: 'absolute',
    bottom: 0, // Stick to bottom
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center', // Center the mic button
    alignItems: 'center',
    paddingVertical: 15, // More padding
    paddingBottom: Platform.OS === 'ios' ? 25 : 15, // Adjust for iPhone notch area
    backgroundColor: 'white', // Match messages container background
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  recordButton: {
    backgroundColor: Colors.light.primary,
    width: 65, // Slightly smaller
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 3, // Android shadow
    // shadowColor: '#000', // iOS shadow
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 2,
  },
  recordingButton: {
    backgroundColor: '#F44336', // Red when recording
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A8A', // Match theme
  },
  loadingText: {
    marginTop: 15,
    color: 'white', // White text on dark blue
    fontSize: 17,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

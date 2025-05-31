import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform,
  ScrollView,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Colors } from '../../../constants/Colors';
import { 
  getConversationHistory, 
  endConversation,
  processTextViaSocket
} from '../../../api/services/public/aiCharacters';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useSocket } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';

interface Message {
  sender: 'user' | 'ai';
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  timestamp: string;
}

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  profileImage: string;
}

interface Conversation {
  _id: string;
  characterId: AICharacter;
  messages: Message[];
  callType: 'video';
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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingAudioUrl, setCurrentPlayingAudioUrl] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState('00:00');
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const cleanupSocketListenersRef = useRef<(() => void) | null>(null);

  // To manage listener subscriptions and timeout for speech recognition
  const speechResultListenerRef = useRef<any>(null);
  const speechErrorListenerRef = useRef<any>(null);
  const recordingTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("id", routeConversationId);
    loadConversation(routeConversationId);
    
    Audio.requestPermissionsAsync()
      .then(({ granted }) => {
        if (!granted) {
          Alert.alert(
            'Microphone Permission Required',
            'Please grant microphone permission to use the audio call feature.'
          );
        }
      });
    
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    
    return () => {
      // Cleanup speech recognition
      if (speechResultListenerRef.current) {
        speechResultListenerRef.current.remove();
        speechResultListenerRef.current = null;
      }
      if (speechErrorListenerRef.current) {
        speechErrorListenerRef.current.remove();
        speechErrorListenerRef.current = null;
      }
      if (recordingTimeoutIdRef.current) {
        clearTimeout(recordingTimeoutIdRef.current);
        recordingTimeoutIdRef.current = null;
      }
      if (isRecording) { // Ensure module is stopped if component unmounts while recording
        ExpoSpeechRecognitionModule.stop();
      } else {
        ExpoSpeechRecognitionModule.abort(); // Abort if not actively recording but might have state
      }
      
      if (sound) {
        sound.unloadAsync();
      }
      if (cleanupSocketListenersRef.current) {
        cleanupSocketListenersRef.current();
      }
    };
  }, [routeConversationId]); // isRecording removed from dependencies as it's managed internally
  
  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > 0) {
      scrollToBottom();
    }
  }, [conversation?.messages]);
  
  const loadConversation = async (convId: string) => {
    try {
      setLoading(true);
      const data = await getConversationHistory(convId);
      console.log("data", data.messages);
      //@ts-ignore
      setConversation(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load conversation. Please try again later.');
      setLoading(false);
      // console.error('Error loading conversation:', err);
    }
  };
  
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };
  
  // Function to format time in MM:SS
  const formatTime = (timeInMillis: number) => {
    const totalSeconds = Math.floor(timeInMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Update timer function
  const updateTimer = (status: AVPlaybackStatus) => {
    if (status && status.isLoaded && !status.didJustFinish && status.durationMillis && status.positionMillis) {
      const remaining = status.durationMillis - status.positionMillis;
      setRemainingTime(formatTime(remaining));
    }
    // If playback did just finish or is not loaded, remainingTime will be reset by onPlaybackStatusUpdate logic
  };
  
  // Add this new function to centrally manage all audio and speech state resets
  const resetAllAudioAndSpeechStates = async (shouldUnloadSound = true) => {
    console.log("[AIVideoCallScreen] Resetting all audio and speech states");
    
    // Reset audio states
    setIsPlaying(false);
    setCurrentPlayingAudioUrl(null);
    setRemainingTime("00:00");
    
    // Unload sound if requested and exists
    if (shouldUnloadSound && sound) {
      console.log("[AIVideoCallScreen] Unloading sound");
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {
        console.warn("[AIVideoCallScreen] Error unloading sound during reset:", e);
      }
    }
    setSound(null);
    
    // Reset speech recognition states
    setIsRecording(false);
    cleanupSpeechRecognition();
  };

  const playOrPauseAudio = async (audioUrlToPlay: string, isLectureAudio = false) => {
    if (sound && currentPlayingAudioUrl === audioUrlToPlay && isPlaying) { // Pausing current
      await sound.pauseAsync();
      setIsPlaying(false);
    } else { // Playing new, resuming paused, or playing a different audio
      // Reset states before starting new audio
      if (sound) { 
        await resetAllAudioAndSpeechStates(true);
      } else {
        await resetAllAudioAndSpeechStates(false);
      }

      try {
        console.log(`[AIVideoCallScreen] Attempting to play audio: ${audioUrlToPlay}`);
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: audioUrlToPlay },
          { shouldPlay: true }
        );
        setSound(newSound); 
        setIsPlaying(true);
        setCurrentPlayingAudioUrl(audioUrlToPlay); // Set the new URL as current

        newSound.setOnPlaybackStatusUpdate((playbackStatus: AVPlaybackStatus) => {
          if (!playbackStatus.isLoaded) {
            // Only reset if this was the intended audio
            if (currentPlayingAudioUrl === audioUrlToPlay) {
              resetAllAudioAndSpeechStates(false); // Don't unload here as it's already unloaded
            }
            if (playbackStatus.error) {
              // console.error(`[AIVideoCallScreen] Playback error on URL ${audioUrlToPlay}:`, playbackStatus.error);
              Alert.alert('Audio Playback Error', `Could not play audio: due to unknown error`);
            }
            return;
          }

          updateTimer(playbackStatus); 

          if (playbackStatus.didJustFinish) {
            console.log(`[AIVideoCallScreen] Audio finished playing: ${audioUrlToPlay}`);
            // Reset all states when audio finishes
            resetAllAudioAndSpeechStates(false); // Don't unload here as playback finished
            newSound.unloadAsync().catch(e => {
                console.warn(`[AIVideoCallScreen] Error unloading sound ${audioUrlToPlay} on finish:`, e);
            });
          }
        });

        if (status.isLoaded && status.durationMillis) {
          setRemainingTime(formatTime(status.durationMillis));
        } else {
          setRemainingTime("00:00"); 
        }

      } catch (e: any) {
        // console.error(`[AIVideoCallScreen] Error creating or playing audio ${audioUrlToPlay}:`, e);
        Alert.alert('Audio Playback Error', `Could not play audio: ${e.message || 'Unknown error'}`);
        await resetAllAudioAndSpeechStates(true);
      }
    }
  };
  
  const cleanupSpeechRecognition = () => {
    speechResultListenerRef.current?.remove();
    speechResultListenerRef.current = null;
    speechErrorListenerRef.current?.remove();
    speechErrorListenerRef.current = null;
    if (recordingTimeoutIdRef.current) {
      clearTimeout(recordingTimeoutIdRef.current);
      recordingTimeoutIdRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      // Stop any currently playing audio and reset all states before starting recording
      if (sound || isPlaying) {
        console.log("[AIVideoCallScreen] Stopping current audio to start recording.");
        if (sound) {
          await sound.stopAsync(); // stopAsync also unloads the sound
        }
        await resetAllAudioAndSpeechStates(false); // Sound already unloaded by stopAsync
      }
      
      // Request permissions if not already granted (good practice)
      const { granted: micPermission } = await Audio.requestPermissionsAsync();
      if (!micPermission) {
        Alert.alert('Microphone Permission Required', 'Please grant microphone permission to use speech recognition.');
        return;
      }
      
      const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPermission.granted) {
        Alert.alert('Speech Recognition Permission Required', 'Please grant speech recognition permission to continue.');
        return;
      }

      setIsRecording(true); // Set recording state
      
      // Clean up any previous listeners & timeout before attaching new ones
      cleanupSpeechRecognition();

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false, // We only care about final results
        continuous: false,
        iosTaskHint: 'unspecified',
      });
      
      speechResultListenerRef.current = ExpoSpeechRecognitionModule.addListener('result', (event) => {
        if (event.results && event.results.length > 0) {
          const transcribedText = event.results[0].transcript;
          if (event.isFinal) {
            console.log("[AIVideoCallScreen] Speech result (final):", transcribedText);
            cleanupSpeechRecognition();
            setIsRecording(false); 
            if (transcribedText && transcribedText.trim() !== '') {
              processTranscribedText(transcribedText);
            } else {
              console.log("[AIVideoCallScreen] Speech recognition resulted in empty text. Not processing.");
            }
          }
        }
      });
      
      speechErrorListenerRef.current = ExpoSpeechRecognitionModule.addListener('error', (event) => {
        // console.error('[AIVideoCallScreen] Speech recognition error:', event.error, event.message);
        // Reset all states on speech error
        resetAllAudioAndSpeechStates(true);

        const errorMessage = event.message?.toLowerCase() || "";
        const errorCode = event.error?.toLowerCase() || "";

        if (errorCode === 'no-speech' || errorMessage.includes("no speech")) {
            console.log("[AIVideoCallScreen] No speech detected by the module.");
        } else if (errorCode === 'network' || errorMessage.includes("network")) {
            Alert.alert('Network Error', 'A network error occurred during speech recognition. Please check your connection and try again.');
        } else if (errorCode === 'recognitionservicebusy' || errorMessage.includes("service busy")) {
            Alert.alert('Service Busy', 'The speech recognition service is currently busy. Please try again in a moment.');
        } else if (errorCode === 'client' && errorMessage.includes("user denied permission")) {
            Alert.alert('Permission Denied', 'Speech recognition permission was denied. Please enable it in settings.');
        } else if (errorCode === 'canceled' || errorMessage.includes("cancelled") || errorMessage.includes("canceled")) {
            console.log("[AIVideoCallScreen] Speech recognition was cancelled (e.g. by stopRecording).");
        } else {
            Alert.alert('Speech Error', `Speech recognition failed: ${event.message || event.error || 'Unknown error'}`);
        }
      });
      
      // Auto-stop after 50 seconds if no final result by then
      recordingTimeoutIdRef.current = setTimeout(() => {
        console.log("[AIVideoCallScreen] Recording timeout (50s) reached. Stopping speech recognition.");
        stopRecording();
      }, 50000);

    } catch (err) {
      // console.error('[AIVideoCallScreen] Failed to start recording:', err);
      await resetAllAudioAndSpeechStates(true);
      Alert.alert('Error', 'Failed to start speech recognition. Please try again.');
    }
  };
  
  const stopRecording = async () => {
    if (!isRecording) {
      console.log("[AIVideoCallScreen] stopRecording called but not currently recording.");
      return;
    }
    
    console.log("[AIVideoCallScreen] Attempting to stop recording.");

    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      // console.error('[AIVideoCallScreen] Failed to stop speech recognition module:', err);
      // Fallback: ensure state is updated and resources are cleaned if stop() call throws.
      setIsRecording(false);
      cleanupSpeechRecognition();
    }
  };
  
  const processTranscribedText = async (text: string) => {
    if (!conversation || !conversation._id) {
      Alert.alert("Error", "Conversation details not loaded yet. Please wait.");
      return;
    }
    if (!user || !user.id) {
      Alert.alert("Error", "User not authenticated. Cannot process request.");
      return;
    }
    if (!socket) {
      Alert.alert("Error", "Socket connection not available.");
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Starting...');

    // Add user message to UI immediately
    const userMessageTimestamp = new Date().toISOString();
    const updatedConvWithUserMsg = {
      ...conversation,
      messages: [
        ...conversation.messages,
        { sender: 'user', content: text, timestamp: userMessageTimestamp }
      ]
    };
    setConversation(updatedConvWithUserMsg);

    // Clean up any previous listeners before attaching new ones
    if (cleanupSocketListenersRef.current) {
        cleanupSocketListenersRef.current();
    }

    cleanupSocketListenersRef.current = processTextViaSocket(
      socket,
      {
        userId: user.id,
        characterId: conversation.characterId._id,
        conversationId: conversation._id,
        userText: text,
        language: 'en-US',
      },
      {
        onTextResponse: (aiResponse, updatedConvId) => {
          setProcessingStatus('AI responded. Waiting for audio...');
          setConversation(prevConv => {
            if (!prevConv) return null;
            // Add AI text message if not already present from user message update
            // This assumes backend `generateResponse` handles DB persistence of AI text
            const aiMessageExists = prevConv.messages.some(m => m.sender === 'ai' && m.content === aiResponse);
            if (!aiMessageExists) {
                return {
                    ...prevConv,
                    _id: updatedConvId,
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
        onAudioComplete: (audioUrl, completedConvId, finalAiResponse) => {
          setProcessingStatus('Audio ready!');
          setIsProcessing(false);
          setConversation(prevConv => {
            if (!prevConv) return null;
            // Find the AI message and update its audioUrl
            // It's safer to update based on content and lack of audioUrl
            const newMessages = prevConv.messages.map(msg => {
              if (msg.sender === 'ai' && msg.content === finalAiResponse && !msg.audioUrl) {
                return { ...msg, audioUrl: audioUrl };
              }
              return msg;
            });
            // If it wasn't found (e.g. state updated weirdly), try adding it if text matches
            const aiMessageExists = newMessages.some(m => m.sender === 'ai' && m.content === finalAiResponse && m.audioUrl === audioUrl);
            if (!aiMessageExists) {
                // This is a fallback, ideally the message is already there from onTextResponse
                 const lastUserMsg = newMessages.filter(m => m.sender ==='user').pop();
                 if (lastUserMsg && lastUserMsg.content === text) { // Ensure it's in response to the last user utterance
                     newMessages.push({ sender: 'ai', content: finalAiResponse, audioUrl: audioUrl, timestamp: new Date().toISOString() });
                 }
            }

            return { ...prevConv, _id: completedConvId, messages: newMessages };
          });
          // Automatically play the AI's audio response
          playOrPauseAudio(audioUrl); 
        },
        onError: (error) => {
          setProcessingStatus(`Error: ${error.message}`);
          setIsProcessing(false);
          Alert.alert('Processing Error', error.message);
          // Optionally implement fallbackToNonStreamingMethod here if desired
        }
      }
    );
  };
  
  const handleEndCall = async () => {
    // Reset all states before ending call
    await resetAllAudioAndSpeechStates(true);
    try {
      if (conversation){
        await endConversation(conversation._id);
      };
      router.back();
    } catch (err) {
      console.error('Error ending call:', err);
      router.back();
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Setting up your call...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !conversation) {
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
  
  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
    <SafeAreaView style={styles.container}>
      {/* Header with timer and controls */}
      <View style={styles.headerControls}>
        <TouchableOpacity style={styles.closeButton} onPress={() => handleEndCall()}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.timerText}>{remainingTime}</Text>
      </View>

      {/* Character Avatar */}
      <View style={styles.avatarSection}>
      <View style={styles.progressContainer}>
          <View style={styles.progressItem}>
            <View style={!isRecording ? [styles.progressDot, styles.activeDot] : styles.progressDot} />
            <Text style={styles.progressLabel}>Lecture</Text>
          </View>
          <View style={styles.progressItem}>
            <View style={isRecording ? [styles.progressDot, styles.activeDot] : styles.progressDot} />
            <Text style={styles.progressLabelInactive}>Practice</Text>
          </View>
        </View>
        <View 
          // onPress={() => {
          //   if (currentPlayingAudioUrl) {
          //     playOrPauseAudio(currentPlayingAudioUrl); // Let playOrPauseAudio handle the toggle
          //   } else {
          //     console.warn(`[AIVideoCallScreen] Avatar pressed, but no currentPlayingAudioUrl is set. Cannot play/pause.`);
          //     // Optionally, you could attempt to play a default intro audio here if desired and available
          //     // For example: if (conversation?.characterId?.profileImage?.endsWith('.mp3')) { // Simple check
          //     //   playOrPauseAudio(conversation.characterId.profileImage, true);
          //     // }
          //   }
          // }}
          style={styles.avatarContainer}
        >
          {conversation.characterId.profileImage ? (
            <Image 
              source={{ uri: conversation.characterId.profileImage }} 
              style={styles.characterAvatar}
            />
          ) : (
            <View style={styles.characterAvatarPlaceholder}>
              <Ionicons name="person" size={60} color={Colors.light.primary} />
            </View>
          )}
          {/* <View style={styles.playIconOverlay}>
            <Ionicons 
              name={isPlaying ? "pause" : "play"} // This reflects the global isPlaying state
              size={30} 
              color="white"
            />
          </View> */}
        </View>

        
      </View>

      {/* Lecture Section View */}
      {/* <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={24} color="white" />
          <Text style={styles.sectionTitle}>Lecture Section</Text>
        </View>
      </View> */}

      {/* Chat Messages */}
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
                      {/* {message.audioUrl && (
                        <TouchableOpacity 
                          style={styles.audioPlayerButton}
                          onPress={() => playOrPauseAudio(message.audioUrl!)}
                        >
                          <Ionicons 
                            name={isPlaying && currentPlayingAudioUrl === message.audioUrl ? "pause-circle-outline" : "play-circle-outline"}
                            size={28} 
                            color={Colors.light.primary} 
                          />
                        </TouchableOpacity>
                      )} */}
                      <TouchableOpacity style={styles.translateButton}>
                        <Ionicons name="language-outline" size={20} color={Colors.light.primary} />
                      </TouchableOpacity>
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
            <Text style={styles.processingText}>{processingStatus}</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Input Controls */}
      <View style={styles.inputControls}>
        
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingButton : null
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={32} 
            color="white" 
          />
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A', // Deep blue background
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  speedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  speedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: 5,
  },
  characterAvatar: {
    width: 100,
    height: 100,
    borderRadius: 75,
  },
  characterAvatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'column',
    marginTop: 10,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: 'white',
  },
  progressLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressLabelInactive: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  sectionCard: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  messageTextContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  aiMessageContent: {
    backgroundColor: '#F2F2F2',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'column', // Keep column for text and controls block
  },
  aiMessageControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  audioPlayerButton: {
    marginRight: 10, // Space between play/pause and translate
  },
  userMessageContent: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 16,
  },
  aiMessageText: {
    fontSize: 16,
    color: '#333',
  },
  userMessageText: {
    fontSize: 16,
    color: 'white',
  },
  translateButton: {
    // alignSelf: 'flex-end', // No longer needed if in aiMessageControls
    // marginTop: 4, // No longer needed if in aiMessageControls
  },
  videoContainer: {
    width: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 200,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.secondary,
  },
  inputControls: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  typeButton: {
    alignItems: 'center',
  },
  inspireButton: {
    alignItems: 'center',
  },
  inputButtonText: {
    color: Colors.light.primary,
    marginTop: 4,
  },
  recordButton: {
    backgroundColor: Colors.light.secondaryDark,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
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
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
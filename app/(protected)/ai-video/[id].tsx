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
  Image,
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
  
  useEffect(() => {
    console.log("id", routeConversationId);
    loadConversation(routeConversationId);
    
    // Set up audio recording
    Audio.requestPermissionsAsync()
      .then(({ granted }) => {
        if (!granted) {
          Alert.alert(
            'Microphone Permission Required',
            'Please grant microphone permission to use the audio call feature.'
          );
        }
      });
    
    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    
    return () => {
      if (isRecording) {
        stopRecording();
      }
      // Clean up any remaining listeners
      ExpoSpeechRecognitionModule.abort();
      
      // Unload audio
      if (sound) {
        sound.unloadAsync();
      }
      if (cleanupSocketListenersRef.current) {
        cleanupSocketListenersRef.current();
      }
    };
  }, [routeConversationId]);
  
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
      setConversation(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load conversation. Please try again later.');
      setLoading(false);
      console.error('Error loading conversation:', err);
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
  
  const playOrPauseAudio = async (audioUrlToPlay: string, isLectureAudio = false) => {
    if (sound && currentPlayingAudioUrl === audioUrlToPlay && isPlaying) { // Pausing current
      await sound.pauseAsync();
      setIsPlaying(false);
      // Timer will naturally stop updating via onPlaybackStatusUpdate when paused
    } else { // Playing new, resuming paused, or playing a different audio
      if (sound) { // If any sound is currently loaded
        await sound.unloadAsync(); // Stop and unload it completely
      }
      // Reset audio states before loading/playing new sound
      setSound(null); // Clear the sound object from state
      setIsPlaying(false); // Reflect that momentarily no sound is playing/loading
      setCurrentPlayingAudioUrl(null);
      setRemainingTime("00:00"); // Reset timer display

      try {
        console.log(`[AIVideoCallScreen] Attempting to play audio: ${audioUrlToPlay}`);
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: audioUrlToPlay },
          { shouldPlay: true }
        );
        setSound(newSound); // Set the new sound object to state
        setIsPlaying(true);
        setCurrentPlayingAudioUrl(audioUrlToPlay);

        newSound.setOnPlaybackStatusUpdate((playbackStatus: AVPlaybackStatus) => {
          if (!playbackStatus.isLoaded) {
            // This block handles cases where sound is unloaded (e.g. by another action) or errors during playback.
            // Check if this callback is for the sound that was meant to be active.
            if (currentPlayingAudioUrl === audioUrlToPlay) {
              setIsPlaying(false);
              setCurrentPlayingAudioUrl(null);
              setRemainingTime("00:00");
              // If sound was unloaded externally or errored, ensure our state reflects it's gone.
              if (sound === newSound) { // Only nullify if 'sound' state still points to this instance
                setSound(null);
              }
              if (playbackStatus.error) {
                console.error(`[AIVideoCallScreen] Playback error on URL ${audioUrlToPlay}:`, playbackStatus.error);
                // Avoid alerting multiple times if error is caught below already
              }
            }
            return;
          }

          // If sound is loaded:
          updateTimer(playbackStatus); // Update timer based on current position and duration

          if (playbackStatus.didJustFinish) {
            // This check ensures we are reacting to the currently intended audio finishing
            if (currentPlayingAudioUrl === audioUrlToPlay) {
              setIsPlaying(false);
              setCurrentPlayingAudioUrl(null);
              setRemainingTime("00:00");
              setSound(null); // Explicitly clear the sound state when playback finishes naturally
            }
            // Unload the sound from memory once it's finished.
            // It's crucial newSound is the object from this closure.
            newSound.unloadAsync().catch(e => {
                console.warn(`[AIVideoCallScreen] Error unloading sound ${audioUrlToPlay} on finish:`, e);
            });
          }
        });

        // Set initial time display if duration is available from the initial load status
        if (status.isLoaded && status.durationMillis) {
          setRemainingTime(formatTime(status.durationMillis));
        } else {
          setRemainingTime("00:00"); // Default if no duration info
        }

      } catch (e: any) {
        console.error(`[AIVideoCallScreen] Error creating or playing audio ${audioUrlToPlay}:`, e);
        Alert.alert('Audio Playback Error', `Could not play audio: ${e.message || 'Unknown error'}`);
        // Ensure states are fully reset on a critical error during setup
        if (sound) { // If a sound object was partially set to state before erroring
            await sound.unloadAsync().catch(() => {}); // Try to unload, ignore error if already gone
        }
        setSound(null);
        setIsPlaying(false);
        setCurrentPlayingAudioUrl(null);
        setRemainingTime("00:00");
      }
    }
  };
  
  const startRecording = async () => {
    try {
      // Stop any currently playing audio before starting recording
      if (sound && isPlaying) {
        await sound.stopAsync(); // stopAsync also unloads the sound
        setIsPlaying(false);
        setCurrentPlayingAudioUrl(null);
        setSound(null); // Clear the sound object from state as it's now invalid
        setRemainingTime("00:00"); // Reset timer display
      }
      
      setIsRecording(true);
      
      // Request permissions
      const { granted: micPermission } = await Audio.requestPermissionsAsync();
      if (!micPermission) {
        Alert.alert('Microphone Permission Required', 'Please grant microphone permission to use speech recognition.');
        setIsRecording(false);
        return;
      }
      
      // Request speech recognition permissions
      const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPermission.granted) {
        Alert.alert('Speech Recognition Permission Required', 'Please grant speech recognition permission to continue.');
        setIsRecording(false);
        return;
      }
      
      // Start speech recognition
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        iosTaskHint: 'unspecified',
      });
      
      // Set up speech recognition event listeners
      const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
        if (event.results && event.results.length > 0) {
          const transcribedText = event.results[0].transcript;
          if (event.isFinal) {
            // Process the final transcribed text
            processTranscribedText(transcribedText);
            // Remove the listener
            resultListener.remove();
            setIsRecording(false);
          }
        }
      });
      
      // Add error listener
      const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
        console.error('Speech recognition error:', event.error, event.message);
        // Alert.alert('Error', `Speech recognition error: ${event.message}`);
        setIsRecording(false);
        errorListener.remove();
      });
      
      // Auto-stop after 10 seconds to prevent indefinite recording
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 10000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start speech recognition. Please try again.');
      setIsRecording(false);
    }
  };
  
  const stopRecording = async () => {
    try {
      if (!isRecording) return;
      
      setIsRecording(false);
      
      // Stop speech recognition
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
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
    try {
      if (!conversation) return;
      
      await endConversation(conversation._id);
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
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.timerText}>{remainingTime}</Text>
      </View>

      {/* Character Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity 
          onPress={() => {
            // A simple check for common audio file extensions
            if (isPlaying && currentPlayingAudioUrl) {
              playOrPauseAudio(currentPlayingAudioUrl, true);
            } else {
              console.warn(`[AIVideoCallScreen] Character profileImage (${audioUrl}) does not appear to be a playable audio file. Playback attempt skipped.`);
              Alert.alert("Playback Issue", "The character's introductory audio is not available or in a recognized format.");
            }
          }}
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
          <View style={styles.playIconOverlay}>
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={30} 
              color="white"
            />
          </View>
        </TouchableOpacity>

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
                    <TouchableOpacity style={styles.translateButton}>
                      <Ionicons name="language-outline" size={20} color={Colors.light.primary} />
                    </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  characterAvatar: {
    width: 150,
    height: 150,
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
    flexDirection: 'row',
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
    flexDirection: 'column',
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
    alignSelf: 'flex-end',
    marginTop: 4,
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
    bottom: 60,
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
    backgroundColor: Colors.light.primary,
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
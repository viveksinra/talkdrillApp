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
import { Video } from 'expo-av';
import { Colors } from '../../../constants/Colors';
import { 
  getConversationHistory, 
  endConversation,
  getLanguageAssessment,
  sendTextForVideo
} from '../../../api/services/public/aiCharacters';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

interface Message {
  sender: 'user' | 'ai';
  content: string;
  videoUrl?: string;
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessment, setAssessment] = useState<{
    metrics: {
      fluency: number;
      vocabulary: number;
      grammar: number;
      pronunciation: number;
    };
    feedback: string;
  } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [remainingTime, setRemainingTime] = useState('00:00');
  const timerIntervalRef = useRef(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const videoRef = useRef<Video>(null);
  const audioUrl = "https://res.cloudinary.com/oasismanor/video/upload/v1748090729/talkdrill/ai-audio/ai_682c9b554c71ee39a0bf882a_1748090727359.mp3";
  
  useEffect(() => {
    console.log("id", id);
    loadConversation();
    
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
    };
  }, [id]);
  
  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > 0) {
      scrollToBottom();
    }
  }, [conversation?.messages]);
  
  const loadConversation = async () => {
    try {
      setLoading(true);
      const data = await getConversationHistory("6831bf547096c0d52ae087d1");
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
  };
  
  const playAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          (status) => updateTimer(status)
        );
        
        setSound(newSound);
        setIsPlaying(true);
        
        // Get the duration once loaded
        const status = await newSound.getStatusAsync();
        if (status.isLoaded) {
          setAudioDuration(status.durationMillis as number);
          setRemainingTime(formatTime(status.durationMillis as number));
        }
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          updateTimer(status);
          
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            setRemainingTime('00:00');
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  };
  
  const startRecording = async () => {
    try {
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
        Alert.alert('Error', `Speech recognition error: ${event.message}`);
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
    if (!conversation) return;
    
    try {
      setIsProcessing(true);
      
      // Add the user message to UI immediately for better UX
      const updatedConversation = {
        ...conversation,
        messages: [
          ...conversation.messages,
          {
            sender: 'user',
            content: text,
            timestamp: new Date().toISOString()
          }
        ]
      };
      setConversation(updatedConversation as any);
      
      // Send transcribed text to server
      const result = await sendTextForVideo(
        text,
        conversation.characterId._id,
        conversation._id,
        'en-US' // Use appropriate language code
      );
      
      console.log(result);
      
      // Update conversation with response from API
      if (result && result.aiResponse) {
        const updatedWithResponseConversation = {
          ...updatedConversation,
          messages: [
            ...updatedConversation.messages,
            {
              sender: 'ai',
              content: result.aiResponse,
              timestamp: new Date().toISOString()
            }
          ]
        };
        setConversation(updatedWithResponseConversation as any);
      } else {
        // Fallback to fetching the updated conversation
        const refreshedConversation = await getConversationHistory(id as string);
        setConversation(refreshedConversation);
      }
      
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      console.error('Error processing text:', err);
      Alert.alert('Error', 'Failed to process your message. Please try again.');
    }
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
        <TouchableOpacity style={styles.retryButton} onPress={loadConversation}>
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
        <TouchableOpacity onPress={playAudio} style={styles.avatarContainer}>
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
            <Text style={styles.processingText}>Processing your response...</Text>
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
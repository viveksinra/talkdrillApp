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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
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
  const [conversation, setConversation] = useState<Conversation | null>(null);
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
  
  const scrollViewRef = useRef<ScrollView>(null);
  const videoRef = useRef<Video>(null);
  
  useEffect(() => {
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
      const data = await getConversationHistory(id as string);
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
      await sendTextForVideo(
        text,
        conversation.characterId._id,
        conversation._id,
        'en-US' // Use appropriate language code
      );
      
      // Fetch updated conversation with AI response and video
      const refreshedConversation = await getConversationHistory(id as string);
      setConversation(refreshedConversation);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      console.error('Error processing text:', err);
      Alert.alert('Error', 'Failed to process your message. Please try again.');
    }
  };
  
  const processAudio = async (audioUri: string) => {
    // This is now handled by performSpeechRecognition and processTranscribedText
    // We keep this for compatibility if needed
  };
  
  const handleEndCall = async () => {
    try {
      if (!conversation) return;
      
      await endConversation(conversation._id);
      
      // Get language assessment
      const assessmentData = await getLanguageAssessment(conversation._id);
      setAssessment(assessmentData);
      setShowAssessment(true);
    } catch (err) {
      console.error('Error ending call:', err);
      router.back();
    }
  };
  
  const handleCloseAssessment = () => {
    setShowAssessment(false);
    router.push('/(protected)/(tabs)/ai-characters');
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
  
  if (showAssessment && assessment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.assessmentContainer}>
          <Text style={styles.assessmentTitle}>Your Language Assessment</Text>
          
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <View style={[styles.metricCircle, { backgroundColor: getMetricColor(assessment.metrics.fluency) }]}>
                <Text style={styles.metricValue}>{assessment.metrics.fluency}</Text>
              </View>
              <Text style={styles.metricLabel}>Fluency</Text>
            </View>
            
            <View style={styles.metricItem}>
              <View style={[styles.metricCircle, { backgroundColor: getMetricColor(assessment.metrics.vocabulary) }]}>
                <Text style={styles.metricValue}>{assessment.metrics.vocabulary}</Text>
              </View>
              <Text style={styles.metricLabel}>Vocabulary</Text>
            </View>
            
            <View style={styles.metricItem}>
              <View style={[styles.metricCircle, { backgroundColor: getMetricColor(assessment.metrics.grammar) }]}>
                <Text style={styles.metricValue}>{assessment.metrics.grammar}</Text>
              </View>
              <Text style={styles.metricLabel}>Grammar</Text>
            </View>
            
            <View style={styles.metricItem}>
              <View style={[styles.metricCircle, { backgroundColor: getMetricColor(assessment.metrics.pronunciation) }]}>
                <Text style={styles.metricValue}>{assessment.metrics.pronunciation}</Text>
              </View>
              <Text style={styles.metricLabel}>Pronunciation</Text>
            </View>
          </View>
          
          <Text style={styles.feedbackTitle}>Feedback</Text>
          <ScrollView style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>{assessment.feedback}</Text>
          </ScrollView>
          
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseAssessment}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        
        <View style={styles.characterInfo}>
          <Text style={styles.characterName}>
            {conversation.characterId.name}
          </Text>
          <Text style={styles.characterProfession}>
            {conversation.characterId.profession}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Ionicons name="call-outline" size={22} color="white" />
        </TouchableOpacity>
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
            {message.sender === 'ai' && message.videoUrl ? (
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: message.videoUrl }}
                  style={styles.video}
                  useNativeControls
                  resizeMode="contain"
                />
              </View>
            ) : (
              <Text style={styles.messageText}>{message.content}</Text>
            )}
          </View>
        ))}
        
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator color={Colors.light.primary} size="small" />
            <Text style={styles.processingText}>Processing your response...</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.controlsContainer}>
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
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop' : 'Tap to speak'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Helper function for metric color
const getMetricColor = (value: number) => {
  if (value >= 80) return Colors.light.primary;
  if (value >= 60) return Colors.light.secondary;
  if (value >= 40) return '#FFC107'; // Warning color - should be defined in Colors
  return '#F44336'; // Error color - should be defined in Colors
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  characterInfo: {
    alignItems: 'center',
    flex: 1,
  },
  characterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  characterProfession: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  endCallButton: {
    backgroundColor: '#F44336', // Error color - should be defined in Colors
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.primary,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
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
  controlsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: Colors.light.secondary,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#F44336', // Error color - should be defined in Colors
  },
  recordButtonText: {
    color: 'white',
    marginTop: 8,
    fontWeight: '500',
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
  assessmentContainer: {
    flex: 1,
    padding: 20,
  },
  assessmentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  feedbackContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.secondary,
  },
  closeButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
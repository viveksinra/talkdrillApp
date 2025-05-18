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
import Colors from '../../../constants/Colors';
import { 
  getConversationHistory, 
  sendAudioForVideo, 
  endConversation,
  getLanguageAssessment
} from '../../../api/services/public/aiCharacters';

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
      if (recording) {
        stopRecording();
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
      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };
  
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        processAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setRecording(null);
      setIsRecording(false);
    }
  };
  
  const processAudio = async (audioUri: string) => {
    if (!conversation) return;
    
    try {
      setIsProcessing(true);
      
      // Read audio file as blob
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create blob from base64
      const blob = Platform.OS === 'web' 
        ? base64ToBlob(audioData, 'audio/wav') 
        : { uri: audioUri, type: 'audio/wav', name: 'audio.wav' };
      
      // Send to server
      const result = await sendAudioForVideo(
        blob as Blob,
        conversation.characterId._id,
        conversation._id,
        'en-US' // Use appropriate language code
      );
      
      // Update conversation with response
      const updatedConversation = await getConversationHistory(id as string);
      setConversation(updatedConversation);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      console.error('Error processing audio:', err);
      Alert.alert('Error', 'Failed to process your message. Please try again.');
    }
  };
  
  // Helper function for web environments
  const base64ToBlob = (base64: string, type: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
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
    router.push('/(protected)/(tabs)/');
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
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
            <ActivityIndicator color={Colors.primary} size="small" />
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
            {isRecording ? 'Stop' : 'Hold to speak'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Helper function for metric color
const getMetricColor = (value: number) => {
  if (value >= 80) return Colors.success;
  if (value >= 60) return Colors.accent;
  if (value >= 40) return Colors.warning;
  return Colors.error;
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
    backgroundColor: Colors.primary,
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
    borderBottomColor: Colors.border,
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
    color: Colors.text,
  },
  characterProfession: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  endCallButton: {
    backgroundColor: Colors.error,
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
    backgroundColor: Colors.primary,
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
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: Colors.accent,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: Colors.error,
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
    color: Colors.textSecondary,
  },
  assessmentContainer: {
    flex: 1,
    padding: 20,
  },
  assessmentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  closeButton: {
    backgroundColor: Colors.primary,
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
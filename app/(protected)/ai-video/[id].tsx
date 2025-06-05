import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors } from '../../../constants/Colors';
import { 
  getConversationHistory, 
  endConversation,
} from '../../../api/services/public/aiCharacters';
import { 
  ExpoSpeechRecognitionModule, 
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionOptions 
} from 'expo-speech-recognition';
import { useSocket } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';
import { AudioBufferManager } from '../../../utils/AudioBufferManager';

interface Message {
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  isChunk?: boolean; // To identify if this is a chunk message
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
  const { 
    socket, 
    startRealtimeSession, 
    sendRealtimeText,
    endRealtimeSession,
    on,
    off 
  } = useSocket();
  const { user } = useAuth();
  
  // State management - Simplified
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');
  const [isAIResponding, setIsAIResponding] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const audioBufferManager = useRef(new AudioBufferManager());
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');
  const hasSentFinalTranscriptRef = useRef<boolean>(false);

  // Speech recognition event handlers using hooks
  useSpeechRecognitionEvent('start', () => {
    console.log('[SPEECH] Speech recognition started');
    hasSentFinalTranscriptRef.current = false; // Reset flag
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('[SPEECH] Speech recognition ended');
    setIsRecording(false);
    
    // Clear silence timer
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Send final transcript if we haven't already
    if (transcriptRef.current && !hasSentFinalTranscriptRef.current) {
      console.log('[SPEECH] Sending final transcript on end:', transcriptRef.current);
      sendTranscriptToServer(transcriptRef.current);
      hasSentFinalTranscriptRef.current = true;
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    console.log('[SPEECH] Result event:', event);
    
    if (event.isFinal && event.results && event.results.length > 0) {
      // Final transcript - send to server
      const finalTranscript = event.results[0]?.transcript;
      if (finalTranscript && !hasSentFinalTranscriptRef.current) {
        console.log('[SPEECH] Final transcript:', finalTranscript);
        sendTranscriptToServer(finalTranscript);
        hasSentFinalTranscriptRef.current = true;
        
        // Stop recording after final result
        setTimeout(() => {
          stopRecording();
        }, 100);
      }
    } else if (event.results && event.results.length > 0) {
      // Interim transcript - update current transcript
      const interimTranscript = event.results[0]?.transcript || '';
      transcriptRef.current = interimTranscript;
      console.log('[SPEECH] Interim transcript:', interimTranscript);
      
      // Reset silence timer
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      // Set new silence timer
      silenceTimeoutRef.current = setTimeout(() => {
        // Silence detected - stop recording
        console.log('[SPEECH] Silence detected, stopping recording');
        if (!hasSentFinalTranscriptRef.current && transcriptRef.current) {
          sendTranscriptToServer(transcriptRef.current);
          hasSentFinalTranscriptRef.current = true;
        }
        stopRecording();
      }, 2000); // Increased to 2 seconds of silence
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('[SPEECH] Speech recognition error:', event);
    setIsRecording(false);
    Alert.alert('Speech Recognition Error', event.message || 'Failed to recognize speech. Please try again.');
  });

  useEffect(() => {
    console.log("Starting AI Video Call with conversation ID:", routeConversationId);
    initializeSession();
    return () => {
      cleanup();
    };
  }, [routeConversationId]);

  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > 0) {
      scrollToBottom();
    }
  }, [conversation?.messages]);

  const initializeSession = async () => {
    try {
      await requestPermissions();
      await loadConversation(routeConversationId);
      setupSocketListeners();
    } catch (err) {
      console.error('Error initializing session:', err);
      setError('Failed to initialize session. Please try again.');
    }
  };

  const requestPermissions = async () => {
    // Request both audio and speech recognition permissions
    const audioPermission = await Audio.requestPermissionsAsync();
    if (!audioPermission.granted) {
      Alert.alert(
        'Microphone Permission Required',
        'Please grant microphone permission to use the audio call feature.'
      );
      return;
    }

    const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!speechPermission.granted) {
      Alert.alert(
        'Speech Recognition Permission Required',
        'Please grant speech recognition permission to use this feature.'
      );
      return;
    }
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  };

  const loadConversation = async (convId: string) => {
    try {
      setLoading(true);
      const data = await getConversationHistory(convId);
      setConversation(data as unknown as Conversation);
      
      if (data && user) {
        console.log('Conversation loaded, starting realtime session');
        //@ts-ignore
        startRealtimeSession(user.id, data.characterId._id, data._id);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load conversation. Please try again later.');
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    console.log('Setting up socket listeners for realtime');
    
    // Session events
    on('realtime_session_started', handleSessionStarted);
    on('realtime_connection_opened', handleConnectionOpened);
    on('realtime_connection_closed', handleConnectionClosed);
    on('realtime_session_created', handleSessionCreated);

    // Text events
    on('realtime_text_delta', handleTextDelta);
    on('realtime_text_complete', handleTextComplete);

    // Audio events
    on('realtime_audio_delta', handleAudioDelta);
    on('realtime_audio_complete', handleAudioComplete);

    // Response events
    on('realtime_response_complete', handleResponseComplete);
    on('realtime_error', handleRealtimeError);
  };

  const removeSocketListeners = () => {
    console.log('Removing socket listeners');
    off('realtime_session_started', handleSessionStarted);
    off('realtime_connection_opened', handleConnectionOpened);
    off('realtime_connection_closed', handleConnectionClosed);
    off('realtime_session_created', handleSessionCreated);
    off('realtime_text_delta', handleTextDelta);
    off('realtime_text_complete', handleTextComplete);
    off('realtime_audio_delta', handleAudioDelta);
    off('realtime_audio_complete', handleAudioComplete);
    off('realtime_response_complete', handleResponseComplete);
    off('realtime_error', handleRealtimeError);
  };

  // Socket event handlers
  const handleSessionStarted = (data: any) => {
    console.log('Realtime session started:', data);
    setConnectionStatus('Session started');
  };

  const handleConnectionOpened = () => {
    console.log('Realtime connection opened');
    setIsConnected(true);
    setConnectionStatus('Connected');
    setIsAIResponding(false);
  };

  const handleConnectionClosed = () => {
    console.log('Realtime connection closed');
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    setIsAIResponding(false);
  };

  const handleSessionCreated = (data: any) => {
    console.log('Realtime session created:', data.sessionId);
    setConnectionStatus('Ready');
    setIsConnected(true);
    setIsAIResponding(false);
  };

  const handleTextDelta = (data: { delta: string; itemId: string }) => {
    console.log('Text delta:', data.delta);
    setIsAIResponding(true);
    
    // Add each chunk as a separate message
    setConversation(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            sender: 'ai',
            content: data.delta,
            timestamp: new Date().toISOString(),
            isChunk: true
          }
        ]
      };
    });
  };

  const handleTextComplete = (data: { text: string; itemId: string; conversationId: string }) => {
    console.log('Text complete:', data.text);
    // Text complete doesn't need to do anything since we're showing chunks
  };

  const handleAudioDelta = async (data: { audioData: string; itemId: string }) => {
    console.log('Audio delta received, length:', data.audioData.length);
    
    // If user starts recording during AI response, clear audio queue
    if (isRecording) {
      console.log('Discarding audio - user is recording');
      await audioBufferManager.current.cleanup();
      return;
    }
    
    // Add audio chunk to buffer for playback
    await audioBufferManager.current.addChunk(data.audioData);
  };

  const handleAudioComplete = (data: { itemId: string; conversationId: string }) => {
    console.log('Audio complete for item:', data.itemId);
  };

  const handleResponseComplete = (data: { responseId: string; status: string }) => {
    console.log('Response complete:', data);
    setIsAIResponding(false);
  };

  const handleRealtimeError = (data: { message: string; error: string }) => {
    console.error('Realtime error:', data);
    Alert.alert('Error', data.message);
    setConnectionStatus(`Error: ${data.error}`);
    setIsAIResponding(false);
  };

  // Recording functions
  const startRecording = async () => {
    try {
      console.log('[SPEECH] Starting speech recognition...');
      
      if (!isConnected) {
        Alert.alert('Not Connected', 'Please wait for the connection to be established.');
        return;
      }
      
      if (isAIResponding) {
        // Interrupt AI response
        console.log('[SPEECH] Interrupting AI response');
        await audioBufferManager.current.cleanup();
        setIsAIResponding(false);
      }

      setIsRecording(true);
      transcriptRef.current = '';
      
      // Configure speech recognition options
      const options: ExpoSpeechRecognitionOptions = {
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
        requiresOnDeviceRecognition: false,
      };

      console.log('[SPEECH] Starting with options:', options);
      
      // Start speech recognition
      ExpoSpeechRecognitionModule.start(options);
      
    } catch (error) {
      console.error('[SPEECH] Error starting speech recognition:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start speech recognition. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('[SPEECH] Stopping speech recognition...');
      
      // Clear silence timer
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      setIsRecording(false);
      
      // Stop speech recognition
      ExpoSpeechRecognitionModule.stop();
      
    } catch (error) {
      console.error('[SPEECH] Error stopping speech recognition:', error);
      setIsRecording(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleEndCall = async () => {
    try {
      console.log('Ending realtime session');
      endRealtimeSession();
      await audioBufferManager.current.cleanup();
      
      if (conversation) {
        await endConversation(conversation._id);
      }
      
      router.back();
    } catch (error) {
      console.error('Error ending call:', error);
      router.back();
    }
  };

  const cleanup = async () => {
    console.log('Cleanup function called');
    
    // Clear timers
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    removeSocketListeners();
    endRealtimeSession();
    await audioBufferManager.current.cleanup();
    
    // Stop speech recognition if active
    if (isRecording) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition:', e);
      }
    }
  };

  // Helper function to send transcript to server
  const sendTranscriptToServer = (transcript: string) => {
    if (!transcript.trim()) return;
    
    // Add user message to UI
    setConversation(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            sender: 'user',
            content: transcript,
            timestamp: new Date().toISOString()
          }
        ]
      };
    });
    
    // Send to server
    sendRealtimeText(transcript);
    transcriptRef.current = '';
  };

  // Render methods
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.sender === 'user';
    
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.aiMessage,
        ]}
      >
        {!isUser && (
          <Image
            source={{ uri: conversation?.characterId.profileImage }}
            style={styles.characterAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            message.isChunk && styles.chunkBubble
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.aiText,
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              initializeSession();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: conversation?.characterId.name || 'AI Video Call',
          headerLeft: () => (
            <TouchableOpacity onPress={handleEndCall} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Connection Status */}
      <View style={styles.statusBar}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
        ]} />
        <Text style={styles.statusText}>{connectionStatus}</Text>
        {isAIResponding && (
          <ActivityIndicator 
            size="small" 
            color={Colors.light.primary} 
            style={styles.processingIndicator} 
          />
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {conversation?.messages.map((message, index) => 
          renderMessage(message, index)
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton,
            !isConnected && styles.disabledButton,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={!isConnected}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={32}
            color="white"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
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
  backButton: {
    padding: 8,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  processingIndicator: {
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  characterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: Colors.light.primary,
    marginLeft: 40,
  },
  aiBubble: {
    backgroundColor: Colors.light.surface,
    marginRight: 40,
  },
  chunkBubble: {
    marginVertical: 2,
    padding: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: Colors.light.text,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  endCallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
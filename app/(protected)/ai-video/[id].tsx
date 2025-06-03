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
} from '../../../api/services/public/aiCharacters';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useSocket } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';
import { AudioBufferManager } from '../../../utils/AudioBufferManager';
import { useMemoryManagement } from '../../../hooks/useMemoryManagement';
import { AudioOptimizer } from '../../../utils/AudioOptimization';

interface Message {
  sender: 'user' | 'ai';
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  audioData?: string; // Base64 audio data
  timestamp: string;
  isTyping?: boolean; // For real-time typing effect
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
    sendRealtimeAudio,
    commitRealtimeAudio,
    endRealtimeSession,
    on,
    off 
  } = useSocket();
  const { user } = useAuth();
  const { addCleanupTask } = useMemoryManagement();
  
  // State management - Optimized (removed unused states)
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
  const recordingRef = useRef<Audio.Recording | null>(null);
  const currentAIMessageRef = useRef<string>('');
  const speechResultListenerRef = useRef<any>(null);
  const speechErrorListenerRef = useRef<any>(null);

  useEffect(() => {
    console.log("Starting AI Video Call with conversation ID:", routeConversationId);
    initializeSession();
    return () => {
      cleanup(); // Call async cleanup without awaiting
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
      
      // Start realtime session immediately after loading conversation
      if (conversation && user) {
        console.log('Starting realtime session for:', conversation.characterId._id);
        startRealtimeSession(user.id, conversation.characterId._id, conversation._id);
      }
    } catch (err) {
      console.error('Error initializing session:', err);
      setError('Failed to initialize session. Please try again.');
    }
  };

  const requestPermissions = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Microphone Permission Required',
        'Please grant microphone permission to use the audio call feature.'
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
      //@ts-ignore
      setConversation(data);
      
      // Start realtime session after conversation is loaded
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
    on('realtime_user_transcript', handleUserTranscript);

    // Audio events
    on('realtime_audio_delta', handleAudioDelta);
    on('realtime_audio_complete', handleAudioComplete);

    // Response events
    on('realtime_response_complete', handleResponseComplete);
    on('realtime_error', handleRealtimeError);

    // Add cleanup tasks
    addCleanupTask(() => removeSocketListeners());
    addCleanupTask(() => audioBufferManager.current.cleanup());
  };

  const removeSocketListeners = () => {
    console.log('Removing socket listeners');
    off('realtime_session_started', handleSessionStarted);
    off('realtime_connection_opened', handleConnectionOpened);
    off('realtime_connection_closed', handleConnectionClosed);
    off('realtime_session_created', handleSessionCreated);
    off('realtime_text_delta', handleTextDelta);
    off('realtime_text_complete', handleTextComplete);
    off('realtime_user_transcript', handleUserTranscript);
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
  };

  const handleConnectionClosed = () => {
    console.log('Realtime connection closed');
    setIsConnected(false);
    setConnectionStatus('Disconnected');
  };

  const handleSessionCreated = (data: any) => {
    console.log('Realtime session created:', data.sessionId);
    setConnectionStatus('Ready for conversation');
  };

  const handleTextDelta = (data: { delta: string; itemId: string }) => {
    // Update current typing message for real-time effect
    currentAIMessageRef.current += data.delta;
    
    // Update conversation with typing indicator
    setConversation(prev => {
      if (!prev) return null;
      
      const updatedMessages = [...prev.messages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      
      if (lastMessage && lastMessage.sender === 'ai' && lastMessage.isTyping) {
        // Update existing typing message
        lastMessage.content = currentAIMessageRef.current;
      } else {
        // Add new typing message
        updatedMessages.push({
          sender: 'ai',
          content: currentAIMessageRef.current,
          timestamp: new Date().toISOString(),
          isTyping: true
        });
      }
      
      return { ...prev, messages: updatedMessages };
    });
  };

  const handleTextComplete = (data: { text: string; itemId: string; conversationId: string }) => {
    console.log('Text complete:', data.text);
    
    // Reset typing state
    currentAIMessageRef.current = '';
    
    // Update conversation with final message
    setConversation(prev => {
      if (!prev) return null;
      
      const updatedMessages = [...prev.messages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      
      if (lastMessage && lastMessage.sender === 'ai' && lastMessage.isTyping) {
        // Update typing message to final
        lastMessage.content = data.text;
        lastMessage.isTyping = false;
      } else {
        // Add new final message
        updatedMessages.push({
          sender: 'ai',
          content: data.text,
          timestamp: new Date().toISOString(),
          isTyping: false
        });
      }
      
      return { ...prev, messages: updatedMessages };
    });
  };

  const handleUserTranscript = (data: { transcript: string; itemId: string; conversationId: string }) => {
    console.log('User transcript:', data.transcript);
    
    // Add user message to conversation
    setConversation(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            sender: 'user',
            content: data.transcript,
            timestamp: new Date().toISOString()
          }
        ]
      };
    });
  };

  const handleAudioDelta = async (data: { audioData: string; itemId: string }) => {
    console.log('Audio delta received, length:', data.audioData.length);
    
    // Validate and optimize audio chunk
    const metrics = AudioOptimizer.calculateChunkMetrics(data.audioData);
    console.log('[AudioOptimizer] Chunk metrics:', metrics);
    
    if (!metrics.isValid) {
      console.error('[AudioOptimizer] Invalid audio chunk received');
      return;
    }
    
    // Add optimized audio chunk to buffer for playback
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

  // Audio recording functions - Enhanced
  const startRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      recordingRef.current = recording;
      setIsRecording(true);
      setIsAIResponding(false);
      
      console.log('Recording started');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      
      const uri = recordingRef.current.getURI();
      if (uri) {
        // For now, we'll just commit the audio - in future we can stream chunks
        commitRealtimeAudio();
        setIsAIResponding(true);
      }

      recordingRef.current = null;
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  // Text input function
  const sendTextMessage = (text: string) => {
    if (!text.trim() || !isConnected) return;
    
    console.log('Sending text message:', text.trim());
    setIsAIResponding(true);
    sendRealtimeText(text.trim());
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
    removeSocketListeners();
    endRealtimeSession();
    await audioBufferManager.current.cleanup();
    
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        console.warn('Error cleaning up recording:', e);
      }
    }
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
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.aiText,
            ]}
          >
            {message.content}
            {message.isTyping && (
              <Text style={styles.typingIndicator}> ●</Text>
            )}
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
            !isConnected && styles.disabledButton
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={!isConnected || isAIResponding}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={30}
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
  typingIndicator: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
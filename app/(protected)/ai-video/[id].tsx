import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  Image,
  Platform,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { audioQueue } from '@/utils/AudioQueueManager';
import { Colors } from '@/constants/Colors';
import { 
  getConversationHistory, 
  endConversation,
  processTextViaSocketStream,
  startAIConversation
} from '@/api/services/public/aiCharacters';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

// Types
type MessageType = 'user' | 'ai';

interface Message {
  sender: MessageType;
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

interface AudioState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  currentAudioUrl: string | null;
}

interface StreamingChunk {
  chunkIndex: number;
  text: string;
  hasAudio: boolean;
}

// Constants
const AUDIO_CONFIG = {
  RECORDING_TIMEOUT: 10000,
  PLAYBACK_DELAY: 200,
  CHUNK_RETRY_DELAY: 500
} as const;

// Custom hook for speech recognition
const useSpeechRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const resultListener = useRef<any>(null);
  const errorListener = useRef<any>(null);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (resultListener.current) {
      resultListener.current.remove();
      resultListener.current = null;
    }
    if (errorListener.current) {
      errorListener.current.remove();
      errorListener.current = null;
    }
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  const startRecording = useCallback(async (
    onResult: (text: string) => void,
    onError: (error: Error) => void
  ) => {
    try {
      const { granted: micPermission } = await Audio.requestPermissionsAsync();
      if (!micPermission) {
        throw new Error('Microphone permission not granted');
      }

      const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPermission.granted) {
        throw new Error('Speech recognition permission not granted');
      }

      cleanup();
      setIsRecording(true);

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        continuous: false,
        iosTaskHint: 'unspecified',
      });

      resultListener.current = ExpoSpeechRecognitionModule.addListener('result', (event) => {
        if (event.results?.[0].transcript) {
          onResult(event.results[0].transcript);
          stopRecording();
        }
      });

      errorListener.current = ExpoSpeechRecognitionModule.addListener('error', (event) => {
        const error = new Error(event.message || 'Speech recognition error');
        onError(error);
        stopRecording();
      });

      timeoutId.current = setTimeout(() => {
        stopRecording();
      }, AUDIO_CONFIG.RECORDING_TIMEOUT);

    } catch (error) {
      onError(error as Error);
      setIsRecording(false);
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    setIsRecording(false);
    cleanup();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.warn('Error stopping speech recognition:', error);
    }
  }, [isRecording, cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
      if (isRecording) {
        ExpoSpeechRecognitionModule.stop();
      }
    };
  }, [isRecording, cleanup]);

  return { isRecording, startRecording, stopRecording };
};

// Main Component
export default function AIVideoCallScreen() {
  // Hooks
  const { id: routeConversationId } = useLocalSearchParams<{ id: string }>();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { isRecording, startRecording: startSpeechRecognition, stopRecording } = useSpeechRecognition();
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const cleanupSocketListenersRef = useRef<(() => void) | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // State
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isProcessing: false,
    isRecording: false,
    currentAudioUrl: null
  });
  const [streamingChunks, setStreamingChunks] = useState<StreamingChunk[]>([]);
  const [hasReceivedGreeting, setHasReceivedGreeting] = useState(false);
  const [remainingTime, setRemainingTime] = useState('00:00');
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    loadConversation(routeConversationId);
    
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(console.error);
    
    return () => {
      cleanupSocketListenersRef.current?.();
      audioQueue.cleanup();
    };
  }, [routeConversationId]);

  useEffect(() => {
    if (conversation?.messages?.length) {
      scrollToBottom();
    }
  }, [conversation?.messages]);

  // Handlers
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleError = useCallback((error: Error, context: string) => {
    console.error(`[${context}] Error:`, error);
    Alert.alert('Error', error.message || 'An unexpected error occurred');
    return error;
  }, []);

  const handleEndCall = useCallback(async () => {
    try {
      await audioQueue.stop();
      if (conversation) {
        await endConversation(conversation._id);
      }
      router.back();
    } catch (error) {
      handleError(error as Error, 'handleEndCall');
      router.back();
    }
  }, [conversation, router, handleError]);

  const playOrPauseAudio = useCallback(async (audioUrl: string) => {
    try {
      if (audioState.isPlaying && audioState.currentAudioUrl === audioUrl) {
        await audioQueue.stop();
        setAudioState(prev => ({ ...prev, isPlaying: false, currentAudioUrl: null }));
      } else {
        setAudioState(prev => ({ ...prev, currentAudioUrl: audioUrl, isPlaying: true }));
        await audioQueue.stop();
        // Use chunk index 0 for single audio playback
        await audioQueue.addToQueue(audioUrl, 0);
      }
    } catch (error) {
      handleError(error as Error, 'playOrPauseAudio');
    }
  }, [audioState.isPlaying, audioState.currentAudioUrl, handleError]);

  const onAudioChunk = useCallback(async (chunkIndex: number, audioUrl: string, chunkText: string) => {
    console.log(`[STREAM] Audio chunk ${chunkIndex} received`);
    
    try {
      // Add chunk to queue with its index for ordering
      await audioQueue.addToQueue(audioUrl, chunkIndex);
      
      // Update UI to show this chunk has audio
      setStreamingChunks(prev => {
        const existingIndex = prev.findIndex(c => c.chunkIndex === chunkIndex);
        if (existingIndex >= 0) {
          // Update existing chunk
          const newChunks = [...prev];
          newChunks[existingIndex] = { ...newChunks[existingIndex], hasAudio: true };
          return newChunks;
        } else {
          // Add new chunk
          return [...prev, { chunkIndex, text: chunkText, hasAudio: true }]
            .sort((a, b) => a.chunkIndex - b.chunkIndex);
        }
      });
    } catch (error) {
      console.error(`Error processing chunk ${chunkIndex}:`, error);
    }
  }, []);

  const processTranscribedText = useCallback(async (text: string) => {
    if (!conversation || !socket || !user) return;

    setAudioState(prev => ({ ...prev, isProcessing: true }));
    setStreamingChunks([]);

    const userMessageTimestamp = new Date().toISOString();
    setConversation(prev => prev ? {
      ...prev,
      messages: [
        ...prev.messages,
        { sender: 'user', content: text, timestamp: userMessageTimestamp }
      ]
    } : null);

    cleanupSocketListenersRef.current?.();

    cleanupSocketListenersRef.current = processTextViaSocketStream(
      socket,
      {
        userId: user.id,
        characterId: conversation.characterId._id,
        conversationId: conversation._id,
        userText: text,
        language: 'en-US',
        useStreaming: true
      },
      {
        onTextChunk: (chunkIndex, chunkText) => {
          setStreamingChunks(prev => {
            // Check if we already have this chunk
            const existingIndex = prev.findIndex(c => c.chunkIndex === chunkIndex);
            
            if (existingIndex >= 0) {
              // Update existing chunk
              const newChunks = [...prev];
              newChunks[existingIndex] = { ...newChunks[existingIndex], text: chunkText };
              return newChunks;
            } else {
              // Add new chunk and sort by chunkIndex
              return [...prev, { chunkIndex, text: chunkText, hasAudio: false }]
                .sort((a, b) => a.chunkIndex - b.chunkIndex);
            }
          });
          
          setConversation(prev => {
            if (!prev) return null;
            
            const newMessages = [...prev.messages];
            let lastMessage = newMessages[newMessages.length - 1];
            
            // Only update conversation messages with complete responses
            // to avoid showing partial chunks in the message history
            if (lastMessage?.sender === 'ai') {
              // If this is the first chunk, replace the message
              if (chunkIndex === 0) {
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  content: chunkText
                };
              } else {
                // For subsequent chunks, append to the existing message
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  content: lastMessage.content + ' ' + chunkText
                };
              }
            } else {
              // Add a new message for the first chunk
              newMessages.push({
                sender: 'ai' as const,
                content: chunkText,
                timestamp: new Date().toISOString()
              });
            }
            
            return { ...prev, messages: newMessages };
          });
        },
        onAudioChunk,
        onResponseComplete: () => {
          setAudioState(prev => ({ ...prev, isProcessing: false }));
        },
        onGreetingText: () => {},
        onGreetingAudio: () => {},
        onStatusUpdate: (status: string, message: string) => {
          console.log(`Status update: ${status} - ${message}`);
        },
        onError: (error: { message: string; details?: any }) => {
          const errorObj = new Error(error.message);
          if (error.details) {
            (errorObj as any).details = error.details;
          }
          console.error('Error in processTextViaSocketStream:', errorObj);
          setAudioState(prev => ({ ...prev, isProcessing: false }));
        }
      }
    );
  }, [conversation, socket, user, onAudioChunk, handleError]);

  const handleRecordPress = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    startSpeechRecognition(
      (text) => {
        if (text.trim()) {
          processTranscribedText(text);
        }
      },
      (error) => {
        if (error.message !== 'Speech recognition was cancelled') {
          Alert.alert('Speech Recognition Error', error.message);
        }
      }
    );
  }, [isRecording, startSpeechRecognition, stopRecording, processTranscribedText]);

  const animateButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();
  }, [scaleAnim]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const onAiChunkText = (data: { chunkIndex: number; chunkText: string; conversationId: string; }) => {
      setStreamingChunks(prev => {
        const existingIndex = prev.findIndex(c => c.chunkIndex === data.chunkIndex);
        if (existingIndex >= 0) {
          const newChunks = [...prev];
          newChunks[existingIndex] = { ...newChunks[existingIndex], text: data.chunkText };
          return newChunks;
        }
        return [...prev, { chunkIndex: data.chunkIndex, text: data.chunkText, hasAudio: false }]
          .sort((a, b) => a.chunkIndex - b.chunkIndex);
      });
    };

    const onAiChunkAudio = (data: { chunkIndex: number; audioUrl: string; conversationId: string; }) => {
      onAudioChunk(data.chunkIndex, data.audioUrl, '');
    };

    const onAiResponseComplete = (data: { fullResponse: string; conversationId: string; totalChunks: number }) => {
      setAudioState(prev => ({ ...prev, isProcessing: false }));
    };

    const onAiStreamError = (error: { message: string; details?: any }) => {
      const errorObj = new Error(error.message);
      if (error.details) {
        (errorObj as any).details = error.details;
      }
      handleError(errorObj, 'socket:ai_stream_error');
      setAudioState(prev => ({ ...prev, isProcessing: false }));
    };

    socket.on('ai_chunk_text_socket', onAiChunkText);
    socket.on('ai_chunk_audio_socket', onAiChunkAudio);
    socket.on('ai_response_complete_socket', onAiResponseComplete);
    socket.on('ai_stream_error_socket', onAiStreamError);

    return () => {
      socket.off('ai_chunk_text_socket', onAiChunkText);
      socket.off('ai_chunk_audio_socket', onAiChunkAudio);
      socket.off('ai_response_complete_socket', onAiResponseComplete);
      socket.off('ai_stream_error_socket', onAiStreamError);
    };
  }, [socket, onAudioChunk, handleError]);

  // Initial data loading
  const loadConversation = useCallback(async (convId: string) => {
    try {
      setLoading(true);
      const data = await getConversationHistory(convId);
      
      // Transform the API response to match the Conversation type
      const transformedData: Conversation = {
        ...data,
        characterId: {
          _id: data.characterId as string,
          name: (data as any).characterName || 'AI Character',
          profession: (data as any).characterProfession || 'Assistant',
          nationality: (data as any).characterNationality || 'Unknown',
          profileImage: (data as any).characterImage || ''
        },
        messages: data.messages || [],
        callType: 'video' as const
      };
      
      setConversation(transformedData);
    } catch (err) {
      const error = err as Error;
      setError('Failed to load conversation. Please try again later.');
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize conversation on mount
  useEffect(() => {
    if (routeConversationId) {
      loadConversation(routeConversationId);
    }
  }, [routeConversationId]);

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error || !conversation) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error || 'Conversation not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => loadConversation(routeConversationId)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleEndCall}
            accessibilityLabel="End call"
            accessibilityHint="Ends the current call"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.timerText}>{remainingTime}</Text>
        </View>

        {/* Character Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            onPress={() => {
              animateButton();
              if (audioState.currentAudioUrl) {
                playOrPauseAudio(audioState.currentAudioUrl);
              }
            }}
            style={styles.avatarContainer}
            accessibilityLabel={`${audioState.isPlaying ? 'Pause' : 'Play'} audio`}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {conversation.characterId.profileImage ? (
                <Image 
                  source={{ uri: conversation.characterId.profileImage }} 
                  style={styles.characterAvatar}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View style={styles.characterAvatarPlaceholder}>
                  <Ionicons name="person" size={60} color={Colors.light.primary} />
                </View>
              )}
            </Animated.View>
            <View style={styles.playIconOverlay}>
              <Ionicons 
                name={audioState.isPlaying ? "pause" : "play"}
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

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {conversation.messages.map((message, index) => {
            const isUser = message.sender === 'user';
            const isLastMessage = index === conversation.messages.length - 1;
            const isStreaming = audioState.isProcessing && !isUser && isLastMessage;
            
            return (
              <View 
                key={`${message.timestamp}-${index}`} 
                style={[
                  styles.messageContainer, 
                  isUser ? styles.userMessage : styles.aiMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  isUser ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.content}
                  {isStreaming && <Text style={styles.streamingIndicator}> ●</Text>}
                </Text>
              </View>
            );
          })}

          {audioState.isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.processingText}>
                {processingStatus || 'Processing...'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Record Button */}
        <View style={styles.inputControls}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingButton
            ]}
            onPress={handleRecordPress}
            disabled={audioState.isProcessing}
            accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
            accessibilityHint="Press and hold to record your message"
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
    backgroundColor: '#1E3A8A',
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 75,
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
  messageText: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  aiMessageText: {
    backgroundColor: '#F2F2F2',
    color: '#333',
  },
  userMessageText: {
    backgroundColor: Colors.light.primary,
    color: 'white',
  },
  streamingIndicator: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    marginVertical: 5,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.light.secondary || '#666',
  },
  inputControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
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
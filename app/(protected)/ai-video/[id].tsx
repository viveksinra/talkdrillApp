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
  processTextViaSocketStream,
  startAIConversation
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

  // NEW: State for streaming functionality
  const [audioChunks, setAudioChunks] = useState<{[key: number]: {audioUrl: string, chunkText: string}}>({});
  const [expectedTotalChunks, setExpectedTotalChunks] = useState<number>(0);
  const [currentPlayingChunkIndex, setCurrentPlayingChunkIndex] = useState<number>(-1);
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [streamingChunks, setStreamingChunks] = useState<Array<{chunkIndex: number, text: string, hasAudio: boolean}>>([]);
  const [hasReceivedGreeting, setHasReceivedGreeting] = useState(false);
  const [debugAudioState, setDebugAudioState] = useState('idle');

  useEffect(() => {
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
      if (isRecording) {
        ExpoSpeechRecognitionModule.stop();
      } else {
        ExpoSpeechRecognitionModule.abort();
      }
      
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
  
  const formatTime = (timeInMillis: number) => {
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
  
  // FIXED: Complete playOrPauseAudio function
  const playOrPauseAudio = async (audioUrl: string, audioId: string = 'default') => {
    try {
      console.log(`[AUDIO] 🎵 PLAY REQUEST: ${audioId}`);
      
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(newSound);
      setCurrentPlayingAudioUrl(audioUrl);
      
      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log(`[AUDIO] ✅ FINISHED: ${audioId}`);
          newSound.unloadAsync();
          setSound(null);
          setCurrentPlayingAudioUrl(null);
          
          // If this was a chunk, try to play next chunk
          if (audioId.startsWith('chunk-')) {
            const finishedChunkIndex = parseInt(audioId.replace('chunk-', ''));
            playNextChunk(finishedChunkIndex + 1);
          }
        }
      });

      await newSound.playAsync();
      setIsPlaying(true);
      console.log(`[AUDIO] ▶️ PLAYING: ${audioId}`);

    } catch (e: any) {
      console.error(`[AUDIO] ❌ ERROR:`, e.message);
      setSound(null);
      setIsPlaying(false);
      setCurrentPlayingAudioUrl(null);
    }
  };
  
  // 2. REPLACE your audio queue effect with this improved version:
  useEffect(() => {
    // Only start if we have audio and nothing is playing
    if (Object.keys(audioChunks).length > 0 && !isPlaying && currentPlayingChunkIndex === -1) {
      console.log(`[AUDIO] 🚀 STARTING QUEUE with ${Object.keys(audioChunks).length} chunks`);
      setCurrentPlayingChunkIndex(0);
      
      // Start first chunk
      if (audioChunks[0]) {
        setTimeout(() => playOrPauseAudio(audioChunks[0].audioUrl), 200);
      }
    }
  }, [Object.keys(audioChunks).length]); // Only depend on queue length

  // 3. IMPROVE your playNextInQueueWithIndex function:
  const playNextChunk = (chunkIndex: number) => {
    console.log(`[AUDIO] 🔍 Looking for chunk ${chunkIndex}`);
    
    if (audioChunks[chunkIndex]) {
      console.log(`[AUDIO] ▶️ Playing chunk ${chunkIndex}`);
      setCurrentPlayingChunkIndex(chunkIndex);
      playOrPauseAudio(audioChunks[chunkIndex].audioUrl, `chunk-${chunkIndex}`);
    } else if (chunkIndex < expectedTotalChunks) {
      console.log(`[AUDIO] ⏳ Chunk ${chunkIndex} not ready yet, waiting...`);
      // Wait a bit and try again
      setTimeout(() => playNextChunk(chunkIndex), 500);
    } else {
      console.log(`[AUDIO] 🏁 All chunks played`);
      setCurrentPlayingChunkIndex(-1);
    }
  };

  // 4. UPDATE your processTranscribedTextStream onAudioChunk callback:
  const processTranscribedTextStream = async (text: string) => {
    if (!conversation || !socket || !user) return;

    // SIMPLE RESET
    setAudioChunks({});
    setExpectedTotalChunks(0);
    setCurrentPlayingChunkIndex(-1);
    setIsProcessing(true);
    setIsStreamingActive(true);
    setStreamingChunks([]);

    const userMessageTimestamp = new Date().toISOString();
    const updatedConvWithUserMsg = {
      ...conversation,
      messages: [
        ...conversation.messages,
        { sender: 'user', content: text, timestamp: userMessageTimestamp }
      ]
    };
    setConversation(updatedConvWithUserMsg);

    if (cleanupSocketListenersRef.current) {
      cleanupSocketListenersRef.current();
    }

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
        onTextChunk: (chunkIndex, chunkText, conversationId) => {
          console.log(`[STREAM] ✅ TEXT CHUNK ${chunkIndex}: "${chunkText}"`);
          setStreamingChunks(prev => [...prev, { chunkIndex, chunkText }]);
          
          // Update conversation with streaming text
          setConversation(prevConv => {
            if (!prevConv) return null;
            const newMessages = [...prevConv.messages];
            const lastMessageIndex = newMessages.length - 1;
            
            if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].sender === 'ai') {
              // Append to existing AI message
              newMessages[lastMessageIndex] = {
                ...newMessages[lastMessageIndex],
                content: newMessages[lastMessageIndex].content + ' ' + chunkText
              };
            } else {
              // Create new AI message
              newMessages.push({
                sender: 'ai',
                content: chunkText,
                timestamp: new Date().toISOString()
              });
            }
            
            return { ...prevConv, messages: newMessages };
          });
        },
        
        onAudioChunk: (chunkIndex, audioUrl, chunkText, conversationId) => {
          console.log(`[STREAM] 🎵 AUDIO CHUNK ${chunkIndex} RECEIVED: ${audioUrl}`);
          
          // Simply store the chunk - order doesn't matter!
          setAudioChunks(prev => ({
            ...prev,
            [chunkIndex]: { audioUrl, chunkText }
          }));
          
          // If this is chunk 0 and nothing is playing, start playing
          if (chunkIndex === 0 && currentPlayingChunkIndex === -1) {
            console.log(`[STREAM] 🚀 Starting playback with chunk 0`);
            setTimeout(() => playNextChunk(0), 200);
          }
        },
        
        onResponseComplete: (fullResponse, conversationId, totalChunks) => {
          console.log(`[STREAM] ✅ RESPONSE COMPLETE - Total chunks: ${totalChunks}`);
          setExpectedTotalChunks(totalChunks);
          setIsStreamingActive(false);
          setIsProcessing(false);
          
          // If we haven't started playing yet, start now
          if (currentPlayingChunkIndex === -1 && Object.keys(audioChunks).length > 0) {
            playNextChunk(0);
          }
        },
        
        onGreetingText: () => {},
        onGreetingAudio: () => {},
        onStatusUpdate: (status, message) => {
          setProcessingStatus(message);
        },
        onError: (error) => {
          console.error('[STREAM] ❌ ERROR:', error);
          setIsProcessing(false);
          setIsStreamingActive(false);
          Alert.alert('Error', error.message);
        }
      }
    );
  };

  // ADDED: Missing speech recognition functions
  const cleanupSpeechRecognition = () => {
    try {
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
    } catch (error) {
      console.warn('[AIVideoCallScreen] Cleanup error:', error);
    }
  };

  const startRecording = async () => {
    try {
      console.log("[AIVideoCallScreen] 🎤 Starting recording...");
      
      // Stop any playing audio first
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
        setIsPlaying(false);
        setCurrentPlayingAudioUrl(null);
        setRemainingTime("00:00"); 
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (e) {
          console.warn("[AIVideoCallScreen] Audio cleanup error:", e);
        }
      }
      
      // Request audio permissions
      const { granted: micPermission } = await Audio.requestPermissionsAsync();
      if (!micPermission) {
        Alert.alert('Microphone Permission Required', 'Please grant microphone permission in your device settings.');
        return;
      }
      
      // Request speech recognition permissions
      const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPermission.granted) {
        Alert.alert('Speech Recognition Permission Required', 'Please grant speech recognition permission in your device settings.');
        return;
      }

      // Clean up any existing listeners
      cleanupSpeechRecognition();

      // Set recording state
      setIsRecording(true);

      // Start speech recognition
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        continuous: false,
        iosTaskHint: 'unspecified',
      });
      
      // Set up result listener
      speechResultListenerRef.current = ExpoSpeechRecognitionModule.addListener('result', (event) => {
        console.log("[AIVideoCallScreen] 🎤 Speech result event:", event);
        
        if (event.results && event.results.length > 0) {
          const transcribedText = event.results[0].transcript;
          if (event.isFinal) {
            console.log("[AIVideoCallScreen] 🎤 Final result:", transcribedText);
            cleanupSpeechRecognition();
            setIsRecording(false); 
            
            if (transcribedText && transcribedText.trim() !== '') {
              processTranscribedTextStream(transcribedText);
            } else {
              console.log("[AIVideoCallScreen] 🎤 Empty transcription received");
            }
          }
        } else {
          console.log("[AIVideoCallScreen] 🎤 No results in speech event");
        }
      });
      
      // Set up error listener with detailed error handling
      speechErrorListenerRef.current = ExpoSpeechRecognitionModule.addListener('error', (event) => {
        console.error('[AIVideoCallScreen] 🎤 Speech error:', event);
        cleanupSpeechRecognition();
        setIsRecording(false);

        // Handle different error types
        const errorCode = event.error?.toLowerCase() || '';
        const errorMessage = event.message?.toLowerCase() || '';
        
        if (errorCode === 'no-speech' || errorMessage.includes('no speech')) {
          console.log('[AIVideoCallScreen] No speech detected - user can try again');
          // Don't show alert for no-speech, just reset
        } else if (errorCode === 'network' || errorMessage.includes('network')) {
          Alert.alert('Network Error', 'Please check your internet connection and try again.');
        } else if (errorCode === 'client' || errorMessage.includes('permission')) {
          Alert.alert('Permission Error', 'Speech recognition permission is required. Please check your settings.');
        } else if (errorCode === 'recognitionservicebusy' || errorMessage.includes('busy')) {
          Alert.alert('Service Busy', 'Speech recognition service is busy. Please try again in a moment.');
        } else {
          console.error('[AIVideoCallScreen] Speech recognition error:', errorCode, errorMessage);
          // Don't show alert for every error, just log it
        }
      });
      
      // Auto-stop timeout
      recordingTimeoutIdRef.current = setTimeout(() => {
        if (isRecording) {
          console.log("[AIVideoCallScreen] Recording timeout reached");
          stopRecording();
        }
      }, 10000);

    } catch (err) {
      console.error('[AIVideoCallScreen] Recording setup failed:', err);
      setIsRecording(false);
      cleanupSpeechRecognition();
      Alert.alert('Recording Error', 'Failed to start speech recognition. Please try again.');
    }
  };
  
  const stopRecording = async () => {
    if (!isRecording) {
      console.log("[AIVideoCallScreen] stopRecording called but not recording");
      return;
    }
    
    console.log("[AIVideoCallScreen] Stopping recording...");
    setIsRecording(false);

    try {
      ExpoSpeechRecognitionModule.stop();
      cleanupSpeechRecognition();
    } catch (err) {
      console.error('[AIVideoCallScreen] Error stopping speech recognition:', err);
      cleanupSpeechRecognition();
    }
  };
  
  useEffect(() => {
    if (conversation && socket && user && !hasReceivedGreeting) {
      // ✅ ALWAYS try to get greeting for new sessions - remove the message length check
      console.log('[AI_VIDEO_CALL] 🎯 INITIALIZING AI CONVERSATION');
      console.log(`[AI_VIDEO_CALL] 📊 Conversation has ${conversation.messages.length} existing messages`);
      
      const cleanup = startAIConversation(
        socket,
        {
          userId: user.id,
          characterId: conversation.characterId._id,
          conversationId: conversation._id
        },
        {
          onGreetingText: (greetingText, conversationId) => {
            console.log('[AI_VIDEO_CALL] ✅ GREETING TEXT RECEIVED:', greetingText);
            
            // Check if this greeting already exists to avoid duplicates
            setConversation(prevConv => {
              if (!prevConv) return null;
              
              // Don't add if this exact greeting is already the last message
              const lastMessage = prevConv.messages[prevConv.messages.length - 1];
              if (lastMessage && lastMessage.sender === 'ai' && lastMessage.content === greetingText) {
                console.log('[AI_VIDEO_CALL] 🔄 Greeting already exists, not adding duplicate');
                return prevConv;
              }
              
              return {
                ...prevConv,
                _id: conversationId,
                messages: [
                  ...prevConv.messages,
                  { sender: 'ai', content: greetingText, timestamp: new Date().toISOString() }
                ]
              };
            });
          },
          onGreetingAudio: (audioUrl, greetingText, conversationId) => {
            console.log('[AI_VIDEO_CALL] 🎵 GREETING AUDIO RECEIVED:', audioUrl);
            
            setConversation(prevConv => {
              if (!prevConv) return null;
              const newMessages = prevConv.messages.map(msg => {
                if (msg.sender === 'ai' && msg.content === greetingText && !msg.audioUrl) {
                  console.log('[AI_VIDEO_CALL] ✅ UPDATED GREETING MESSAGE WITH AUDIO');
                  return { ...msg, audioUrl: audioUrl };
                }
                return msg;
              });
              return { ...prevConv, messages: newMessages };
            });
            
            setHasReceivedGreeting(true);
            
            setTimeout(() => {
              console.log('[AI_VIDEO_CALL] 🎵 ATTEMPTING TO PLAY GREETING');
              playOrPauseAudio(audioUrl); 
            }, 1000);
          },
          onError: (error) => {
            console.error('[AI_VIDEO_CALL] ❌ GREETING ERROR:', error);
            Alert.alert('Greeting Error', error.message);
            setHasReceivedGreeting(true);
          }
        }
      );

      return cleanup;
    }
  }, [conversation, socket, user, hasReceivedGreeting]);
  
  const handleEndCall = async () => {
    if(sound){
      await sound.pauseAsync();
      setIsPlaying(false);
    }
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
        <TouchableOpacity 
          onPress={() => {
            if (currentPlayingAudioUrl) {
              playOrPauseAudio(currentPlayingAudioUrl);
            } else {
              console.warn(`[AIVideoCallScreen] Avatar pressed, but no currentPlayingAudioUrl is set.`);
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

      {/* Chat Messages with streaming support */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {/* Add this temporarily above your messages for debugging */}
        {__DEV__ && (
          <View style={{ backgroundColor: 'yellow', padding: 10, margin: 10 }}>
            <Text style={{ fontSize: 12, color: 'black' }}>
              DEBUG - Messages: {conversation?.messages.length || 0}
            </Text>
            <Text style={{ fontSize: 12, color: 'black' }}>
              Streaming Chunks: {streamingChunks.length}
            </Text>
            <Text style={{ fontSize: 12, color: 'black' }}>
              Last Message: {conversation?.messages[conversation?.messages.length - 1]?.content?.substring(0, 50) || 'None'}...
            </Text>
          </View>
        )}
        
        {conversation?.messages.map((message, index) => {
          const isUser = message.sender === 'user';
          const isStreaming = isStreamingActive && message.sender === 'ai' && index === conversation?.messages.length - 1;
          
          return (
            <View key={index} style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
              <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
                {message.content}
                {isStreaming && <Text style={styles.streamingIndicator}> ●</Text>}
              </Text>
              
              {/* {!isUser && message.audioUrl && (
                        <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => playOrPauseAudio(message.audioUrl)}
                        >
                          <Ionicons 
                    name={currentPlayingAudioUrl === message.audioUrl && isPlaying ? "pause" : "play"} 
                    size={16} 
                            color={Colors.light.primary} 
                          />
                        </TouchableOpacity>
                      )} */}
              
              {!isUser && isStreaming && (
                <Text style={styles.streamingStatus}>
                  Chunks: {streamingChunks.filter(c => c.hasAudio).length}/{streamingChunks.length} with audio
                </Text>
                )}
              </View>
          );
        })}
        
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.processingText}>{processingStatus}</Text>
            {isStreamingActive && (
              <Text style={styles.streamingInfo}>
                Streaming in progress... {streamingChunks.length} chunks received
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Debug Display - Remove in production */}
      {__DEV__ && (
        <View style={{ position: 'absolute', top: 100, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 5, borderRadius: 5 }}>
          <Text style={{ color: 'white', fontSize: 10 }}>
            Audio State: {debugAudioState}
          </Text>
          <Text style={{ color: 'white', fontSize: 10 }}>
            Queue: {Object.keys(audioChunks).length} | Index: {currentPlayingChunkIndex}
          </Text>
          <Text style={{ color: 'white', fontSize: 10 }}>
            Playing: {isPlaying ? 'YES' : 'NO'} | Active: {Object.keys(audioChunks).length > 0 ? 'YES' : 'NO'}
          </Text>
          <Text style={{ color: 'white', fontSize: 9 }}>
            Chunks: [{Object.keys(audioChunks).join(', ')}]
          </Text>
        </View>
      )}
      
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
  },
  aiMessageText: {
    fontSize: 16,
    color: '#333',
  },
  userMessageText: {
    fontSize: 16,
    color: 'white',
  },
  playButton: {
    marginLeft: 10,
  },
  streamingIndicator: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  streamingStatus: {
    fontSize: 10,
    color: Colors.light.secondary || '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginVertical: 5,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.light.secondary || '#666',
  },
  streamingInfo: {
    fontSize: 10,
    color: Colors.light.primary,
    marginLeft: 8,
    fontStyle: 'italic',
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
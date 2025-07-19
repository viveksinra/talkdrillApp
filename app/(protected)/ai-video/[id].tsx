import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,Text,
  Easing,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Colors } from "../../../constants/Colors";
import {
  getConversationHistory,
  endConversation,
} from "../../../api/services/public/aiCharacters";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionOptions,
} from "expo-speech-recognition";
import { useSocket } from "../../../contexts/SocketContext";
import { useAuth } from "../../../contexts/AuthContext";
import { AudioBufferManager } from "../../../utils/AudioBufferManager";
import { useHeaderHeight } from '@react-navigation/elements';
import { deductCoins, createAICallTransaction } from "../../../api/services/coinService";

// Import new components
import { CallHeader } from "@/components/ui/calling/CallHeader";
import { VideoSection } from "@/components/ui/calling/VideoSection";
import { MessagesSection } from "@/components/ui/calling/MessagesSection";
import { CallControls } from "@/components/ui/calling/CallControls";

interface Message {
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  isChunk?: boolean;
  isLoading?: boolean;
  hidden?: boolean;
  audioData?: boolean;
  loadingType?: "voice_processing" | "text_generating";
}

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  profileImage: string;
  idleVideoUrl?: string;
  speechVideoUrl?: string;
}

interface Conversation {
  _id: string;
  characterId: AICharacter;
  messages: Message[];
  callType: "video";
}

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT / 3;
const CHAT_HEIGHT = (SCREEN_HEIGHT * 2) / 3;

export default function AIVideoCallScreen() {
  const { id: routeConversationId, gender, accent, languageProficiency } = 
    useLocalSearchParams<{ id: string, gender: string, accent: string, languageProficiency: string, aiCharacterName: string }>();
 
  const {
    startRealtimeSession,
    sendRealtimeText,
    endRealtimeSession,
    on,
    off,
  } = useSocket();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();

  // State management - Simplified
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...");
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  
  // State to track actual audio playback
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // State to track video system readiness
  const [videosReady, setVideosReady] = useState(false);
  const [videosFailed, setVideosFailed] = useState(false);

  // State and ref for delayed text display
  const [shouldShowAIText, setShouldShowAIText] = useState(false);
  const pendingTextContentRef = useRef<string>("");
  const currentAIMessageIndexRef = useRef<number>(-1);

  // Full screen state and animation
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenAnimation = useRef(new Animated.Value(0)).current;
  
  // Message input state
  const [textMessage, setTextMessage] = useState("");

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const audioBufferManager = useRef(new AudioBufferManager());
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>("");
  const hasSentFinalTranscriptRef = useRef<boolean>(false);
  const audioChunksRef = useRef<string[]>([]);
  const currentLoadingMessageIdRef = useRef<string | null>(null);

  const [renderMode, setRenderMode] = useState<"video" | "chat">("video");

  // Add loading message state
  const [userLoadingMessageId, setUserLoadingMessageId] = useState<string | null>(null);

  // Add this ref after other refs
  const hasTriggeredInitialConversationRef = useRef<boolean>(false);

  // Coin timer state and refs
  const [coinsSpentThisCall, setCoinsSpentThisCall] = useState(0);
  const minuteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  // Stable callback functions to prevent infinite loops
  const handleVideoLoadStart = useCallback(() => {
    console.log('[VIDEO-PARENT] Loading started - resetting states');
    setVideosReady(false);
    setVideosFailed(false);
  }, []);

  const handleVideoLoad = useCallback(() => {
    console.log('[VIDEO-PARENT] Both videos completed! Setting videosReady=true');
    setVideosReady(true);
    setVideosFailed(false);
  }, []);

  const handleVideoError = useCallback((error: any) => {
    console.error('[VIDEO-PARENT] Error occurred:', error);
    setVideosReady(false);
    setVideosFailed(true);
  }, []);

  // Full screen handlers
  const toggleFullScreen = useCallback(() => {
    const toValue = isFullScreen ? 0 : 1;
    setIsFullScreen(!isFullScreen);
    
    Animated.timing(fullScreenAnimation, {
      toValue,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start();
  }, [isFullScreen, fullScreenAnimation]);

  // Speech recognition event handlers using hooks
  useSpeechRecognitionEvent("start", () => {
    console.log("[SPEECH] Speech recognition started");
    hasSentFinalTranscriptRef.current = false;
    setIsProcessingVoice(true);
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("[SPEECH] Speech recognition ended");
    setIsRecording(false);
    setIsProcessingVoice(false);

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (transcriptRef.current && !hasSentFinalTranscriptRef.current) {
      console.log("[SPEECH] Sending final transcript on end:", transcriptRef.current);
      sendTranscriptToServer(transcriptRef.current);
      hasSentFinalTranscriptRef.current = true;
    }
  });

  useSpeechRecognitionEvent("result", (event) => {
    console.log("[SPEECH] Result event:", event);

    if (event.results && event.results.length > 0) {
      const transcript = event.results[0]?.transcript || "";
      transcriptRef.current = transcript;
      console.log("[SPEECH] Transcript:", transcript);
      
      // Reset silence timeout on each result
      if (isRecording) {
        resetSilenceTimeout();
      }
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("[SPEECH] Speech recognition error:", event);
    setIsRecording(false);
    // Alert.alert(
    //   "Speech Recognition Error",
    //   event.message || "Failed to recognize speech. Please try again."
    // );
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

  // Enhanced AudioBufferManager with playback state tracking
  useEffect(() => {
    const enhancedAudioManager = new AudioBufferManager();
    
    const originalPlayMergedAudio = enhancedAudioManager.playMergedAudio.bind(enhancedAudioManager);
    enhancedAudioManager.playMergedAudio = async function(audioChunks: string[]) {
      try {
        setIsAudioPlaying(true);
        console.log('[VIDEO] Audio playback started - switching to speech video');
        
        setShouldShowAIText(true);
        
        await originalPlayMergedAudio(audioChunks);
        
        console.log('[VIDEO] Audio playback finished - switching to idle video');
        setIsAudioPlaying(false);
      } catch (error) {
        console.error('[VIDEO] Audio playback error:', error);
        setIsAudioPlaying(false);
        throw error;
      }
    };

    const originalStop = enhancedAudioManager.stop.bind(enhancedAudioManager);
    enhancedAudioManager.stop = async function() {
      setIsAudioPlaying(false);
      console.log('[VIDEO] Audio stopped - switching to idle video');
      await originalStop();
    };

    const originalCleanup = enhancedAudioManager.cleanup.bind(enhancedAudioManager);
    enhancedAudioManager.cleanup = async function() {
      setIsAudioPlaying(false);
      console.log('[VIDEO] Audio cleanup - switching to idle video');
      await originalCleanup();
    };

    audioBufferManager.current = enhancedAudioManager;

    return () => {
      setIsAudioPlaying(false);
    };
  }, []);

  // Effect to animate text display when shouldShowAIText becomes true
  useEffect(() => {
    if (shouldShowAIText && pendingTextContentRef.current && currentAIMessageIndexRef.current >= 0) {
      console.log('[TEXT-SYNC] Starting synchronized text display');
            
      // Animate text display character by character
      const fullText = pendingTextContentRef.current;
      let currentIndex = 0;
      
      const animateText = () => {
        if (currentIndex <= fullText.length) {
          const partialText = fullText.substring(0, currentIndex);
          
          setConversation((prev) => {
            if (!prev) return null;

            const messages = [...prev.messages];
            const messageIndex = currentAIMessageIndexRef.current;
            
            if (messageIndex >= 0 && messageIndex < messages.length && messages[messageIndex].sender === "ai") {
              messages[messageIndex] = {
                ...messages[messageIndex],
                content: partialText,
                isLoading: false,
              };
            }

            return {
              ...prev,
              messages,
            };
          });
          
          currentIndex += 2;
          setTimeout(animateText, 50);
        } else {
          console.log('[TEXT-SYNC] Text animation complete');
          pendingTextContentRef.current = "";
          currentAIMessageIndexRef.current = -1;
          setShouldShowAIText(false);
        }
      };
      
      animateText();
    }
  }, [shouldShowAIText]);

  // Check if both AI and videos are ready, then trigger conversation
  const checkReadinessAndTrigger = useCallback(() => {
    const aiReady = isConnected;
    let videoSystemReady = videosReady || videosFailed;
    const systemReady = aiReady && videoSystemReady;

    if (systemReady && !hasTriggeredInitialConversationRef.current) {
      console.log('[SYSTEM] Both AI and video system ready - triggering conversation');
      hasTriggeredInitialConversationRef.current = true;
      triggerAIForConversation();
    }
  }, [isConnected, videosReady, videosFailed]);

  // Effect to trigger readiness check when videos become ready OR fail
  useEffect(() => {
    console.log('[MAIN-STATE] Video state changed:', { 
      videosReady, 
      videosFailed, 
      isConnected, 
      renderMode 
    });
    
    if (videosReady || videosFailed) {
      console.log('[EFFECT] Triggering readiness check due to video state change');
      checkReadinessAndTrigger();
    }
  }, [videosReady, videosFailed, isConnected, checkReadinessAndTrigger]);

  const initializeSession = async () => {
    try {
      await requestPermissions();
      await loadConversation(routeConversationId, {
        gender,
        accent,
        languageProficiency
      });
      setupSocketListeners();
    } catch (err) {
      console.error("Error initializing session:", err);
      setError("Failed to initialize session. Please try again.");
    }
  };

  const requestPermissions = async () => {
    const audioPermission = await Audio.requestPermissionsAsync();
    if (!audioPermission.granted) {
      Alert.alert(
        "Microphone Permission Required",
        "Please grant microphone permission to use the audio call feature."
      );
      return;
    }

    const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!speechPermission.granted) {
      Alert.alert(
        "Speech Recognition Permission Required",
        "Please grant speech recognition permission to use this feature."
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

  const loadConversation = async (convId: string, filters: any) => {
    try {
      setLoading(true);
      const data = await getConversationHistory(convId);
      setConversation(data as unknown as Conversation);

      if (data && user) {
        console.log("Conversation loaded, starting realtime session");
        //@ts-ignore
        startRealtimeSession(user.id, data.characterId._id, data._id, filters);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load conversation. Please try again later.");
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    console.log("Setting up socket listeners for realtime");

    on("realtime_session_started", handleSessionStarted);
    on("realtime_connection_opened", handleConnectionOpened);
    on("realtime_connection_closed", handleConnectionClosed);
    on("realtime_session_created", handleSessionCreated);
    on("realtime_text_delta", handleTextDelta);
    on("realtime_text_complete", handleTextComplete);
    on("realtime_audio_delta", handleAudioDelta);
    on("realtime_audio_complete", handleAudioComplete);
    on("realtime_response_complete", handleResponseComplete);
    on("realtime_error", handleRealtimeError);
    on("realtime_ai_responding_start", handleAIRespondingStart);
  };

  const removeSocketListeners = () => {
    console.log("Removing socket listeners");
    off("realtime_session_started", handleSessionStarted);
    off("realtime_connection_opened", handleConnectionOpened);
    off("realtime_connection_closed", handleConnectionClosed);
    off("realtime_session_created", handleSessionCreated);
    off("realtime_text_delta", handleTextDelta);
    off("realtime_text_complete", handleTextComplete);
    off("realtime_audio_delta", handleAudioDelta);
    off("realtime_audio_complete", handleAudioComplete);
    off("realtime_response_complete", handleResponseComplete);
    off("realtime_error", handleRealtimeError);
    off("realtime_ai_responding_start", handleAIRespondingStart);
  };

  // Socket event handlers
  const handleSessionStarted = (data: any) => {
    console.log("Realtime session started:", data);
    setConnectionStatus("Session started");
  };

  const handleConnectionOpened = () => {
    console.log("Realtime connection opened");
    setIsConnected(true);
    setConnectionStatus("Connected");
    setIsAIResponding(false);
  };

  const handleConnectionClosed = () => {
    console.log("Realtime connection closed");
    setIsConnected(false);
    setConnectionStatus("Disconnected");
    setIsAIResponding(false);
  };

  const handleSessionCreated = (data: any) => {
    console.log("Realtime session created:", data.sessionId);
    setConnectionStatus("Ready To Talk");
    setIsConnected(true);
    setIsAIResponding(false);
    checkReadinessAndTrigger();
  };

  function triggerAIForConversation(){
    console.log('[TRIGGER] AI conversation triggered!', {
      user: user?.name,
      videosReady,
      videosFailed,
      isConnected,
      renderMode
    });
    
    // Start coin timer when AI conversation begins
    startCoinTimer();
    
    sendRealtimeText(`Hello, first please introduce yourself and behave like a human being. 
      This is a conversation triggered by a user. so As AI please act like AI is starting the conversation mention user name(${user?.name}) 
      while greeting/initiate the conversation. please exclude any special characters and symbols.
      keep the conversation going by asking questions and if user is proactive enough then you can just help them talking and practicing.
      `);
  }

  // Coin timer functions
  const startCoinTimer = () => {
    console.log('[COIN-TIMER] Starting coin timer');
    callStartTimeRef.current = new Date();
    
    // Start minute timer for coin deduction
    minuteTimerRef.current = setInterval(async () => {
      try {
        console.log('[COIN-TIMER] Deducting 1 coin for minute usage');
        await deductCoins(1);
        setCoinsSpentThisCall(prev => prev + 1);
        console.log('[COIN-TIMER] Coin deducted successfully');
      } catch (error: any) {
        console.error('[COIN-TIMER] Error deducting coin:', error);
        
        // Check if it's insufficient balance error
        if (error.message && error.message.includes('Insufficient coins')) {
          // Stop the timer immediately to prevent further deductions
          stopCoinTimer();
          Alert.alert(
            "Insufficient Coins",
            "You have insufficient coins to continue the AI call",
            [{ text: "OK", onPress: () => handleEndCall() }]
          );
          return;
        }
        
        // For other errors, continue but log
        console.warn('[COIN-TIMER] Continuing call despite coin deduction error');
      }
    }, 60000); // Every minute (60 seconds)
  };

  const stopCoinTimer = () => {
    console.log('[COIN-TIMER] Stopping coin timer');
    if (minuteTimerRef.current) {
      clearInterval(minuteTimerRef.current);
      minuteTimerRef.current = null;
    }
  };

  const createFinalTransaction = async () => {
    if (coinsSpentThisCall > 0 && conversation?._id) {
      try {
        console.log('[COIN-TIMER] Creating final transaction for', coinsSpentThisCall, 'coins');
        await createAICallTransaction(conversation._id, coinsSpentThisCall);
        console.log('[COIN-TIMER] Final transaction created successfully');
      } catch (error) {
        console.error('[COIN-TIMER] Error creating final transaction:', error);
        // Don't block call end for transaction creation errors
        // But log the error for debugging
        console.warn('[COIN-TIMER] Call ended without recording final transaction');
      }
    } else {
      console.log('[COIN-TIMER] No coins spent or conversation missing, skipping final transaction');
    }
  };

  const handleTextDelta = (data: { delta: string; itemId: string }) => {
    console.log("Text delta:", data.delta);
    setIsAIResponding(true);

    pendingTextContentRef.current += data.delta;

    setConversation((prev) => {
      if (!prev) return null;

      const messages = [...prev.messages];
      const lastMessageIndex = messages.length - 1;
      
      if (lastMessageIndex >= 0 && 
          messages[lastMessageIndex].sender === "ai" && 
          messages[lastMessageIndex].isLoading) {
        messages[lastMessageIndex] = {
          sender: "ai",
          content: "",
          timestamp: new Date().toISOString(),
          isChunk: true,
          isLoading: true,
          loadingType: "text_generating",
        };
        currentAIMessageIndexRef.current = lastMessageIndex;
      } else {
        const lastAIMessage = messages[lastMessageIndex];
        if (lastAIMessage && lastAIMessage.sender === "ai") {
          currentAIMessageIndexRef.current = lastMessageIndex;
        } else {
          messages.push({
            sender: "ai",
            content: "",
            timestamp: new Date().toISOString(),
            isChunk: true,
            isLoading: true,
            loadingType: "text_generating",
          });
          currentAIMessageIndexRef.current = messages.length - 1;
        }
      }

      return {
        ...prev,
        messages,
      };
    });
  };

  const handleTextComplete = (data: {
    text: string;
    itemId: string;
    conversationId: string;
  }) => {
    console.log("Text complete:", data.text);
    
    setIsGeneratingText(false);
    pendingTextContentRef.current = data.text;
    
    setConversation((prev) => {
      if (!prev) return null;

      const messages = [...prev.messages];
      const messageIndex = currentAIMessageIndexRef.current;
      
      if (messageIndex >= 0 && messageIndex < messages.length && messages[messageIndex].sender === "ai") {
        messages[messageIndex] = {
          ...messages[messageIndex],
          content: "",
          isLoading: true,
          loadingType: "text_generating",
        };
      }

      return {
        ...prev,
        messages,
      };
    });
  };

  const handleAudioDelta = async (data: {
    audioData: string;
    itemId: string;
  }) => {
    audioChunksRef.current.push(data.audioData);
  };

  const handleAudioComplete = async (data: {
    itemId: string;
    conversationId: string;
    text?: string;
    audioChunkCount?: number;
  }) => {
    console.log("Audio complete:", data);

    if (audioChunksRef.current.length > 0) {
      await audioBufferManager.current.playMergedAudio(audioChunksRef.current);
      audioChunksRef.current = [];
    }

    currentLoadingMessageIdRef.current = null;
  };

  const handleResponseComplete = (data: {
    responseId: string;
    status: string;
  }) => {
    console.log("Response complete:", data);
    setIsAIResponding(false);
  };

  const handleRealtimeError = (data: { message: string; error: string }) => {
    console.error("Realtime error:", data);
    Alert.alert("Error", data.message);
    setConnectionStatus(`Error: ${data.error}, please restart the app`);
    setIsAIResponding(false);
  };

  const handleAIRespondingStart = (data: {
    responseId: string;
    timestamp: Date;
  }) => {
    console.log("AI starting to respond:", data);
    setIsAIResponding(true);

    audioChunksRef.current = [];
    audioBufferManager.current.cleanup();
    
    setShouldShowAIText(false);
    pendingTextContentRef.current = "";
    currentAIMessageIndexRef.current = -1;
  };

  // Recording functions
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      console.log("[SPEECH] Starting speech recognition...");

      let videoSystemReady = videosReady || videosFailed;
      const systemReady = isConnected && videoSystemReady;
      
      if (!systemReady) {
        let statusMessage = "Please wait for the system to be ready.";
        if (!isConnected) {
          statusMessage = "Please wait for the AI connection to be established.";
        } else if (!videosReady && !videosFailed) {
          statusMessage = "Please wait for videos to load.";
        }
        
        Alert.alert("System Not Ready", statusMessage);
        return;
      }

      if (isAIResponding) {
        console.log("[SPEECH] Interrupting AI response");
        await audioBufferManager.current.stop();
        await audioBufferManager.current.cleanup();
        setIsAIResponding(false);
      }

      setIsRecording(true);
      transcriptRef.current = "";
      hasSentFinalTranscriptRef.current = false;

      const options: ExpoSpeechRecognitionOptions = {
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
        requiresOnDeviceRecognition: false,
      };

      console.log("[SPEECH] Starting with options:", options);
      ExpoSpeechRecognitionModule.start(options);
      
      // Set silence timeout for auto-stop (3 seconds of silence)
      resetSilenceTimeout();
    } catch (error) {
      console.error("[SPEECH] Error starting speech recognition:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      console.log("[SPEECH] Stopping speech recognition...");

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      setIsRecording(false);
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error("[SPEECH] Error stopping speech recognition:", error);
      setIsRecording(false);
    }
  };

  // New function to handle auto-stop on silence
  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    silenceTimeoutRef.current = setTimeout(() => {
      console.log("[SPEECH] Silence detected, auto-stopping recording");
      if (isRecording && transcriptRef.current.trim()) {
        stopRecording();
      }
    }, 500); // 0.5 seconds of silence
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
      console.log("Ending realtime session");
      endRealtimeSession();
      await audioBufferManager.current.cleanup();
      stopCoinTimer(); // Stop coin timer on call end
      await createFinalTransaction(); // Create final transaction on call end

      if (conversation) {
        await endConversation(conversation._id);
      }

      if(conversation){
        console.log("Starting report generation");
        router.replace({
          pathname: '/report-loading',
          params: {
            type: 'ai-conversation',
            conversationId: conversation._id,
          }
        })
      }else{
        router.back();
      }

    } catch (error) {
      console.error("Error ending call:", error);
      router.back();
    }
  };

  const cleanup = async () => {
    console.log("Cleanup function called");

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    removeSocketListeners();
    endRealtimeSession();
    await audioBufferManager.current.cleanup();
    stopCoinTimer(); // Ensure coin timer is stopped on cleanup

    if (isRecording) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (e) {
        console.warn("Error stopping speech recognition:", e);
      }
    }
  };

  const sendTranscriptToServer = (transcript: string) => {
    if (!transcript.trim()) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setConversation((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            sender: "user",
            content: "",
            timestamp: new Date().toISOString(),
            isLoading: true,
            loadingType: "voice_processing",
          },
        ],
      };
    });

    setUserLoadingMessageId(messageId);

    setTimeout(() => {
      setConversation((prev) => {
        if (!prev) return null;

        const messages = [...prev.messages];
        const lastMessageIndex = messages.length - 1;
        
        if (lastMessageIndex >= 0 && messages[lastMessageIndex].isLoading) {
          messages[lastMessageIndex] = {
            sender: "user",
            content: transcript,
            timestamp: new Date().toISOString(),
            isLoading: false,
          };
        }

        return {
          ...prev,
          messages,
        };
      });

      setUserLoadingMessageId(null);
      setIsGeneratingText(true);
      
      setConversation((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              sender: "ai",
              content: "",
              timestamp: new Date().toISOString(),
              isLoading: true,
              loadingType: "text_generating",
            },
          ],
        };
      });

      sendRealtimeText(transcript);
      transcriptRef.current = "";
    }, 800);
  };

  const sendTextMessage = () => {
    if (!textMessage.trim()) return;

    const transcript = textMessage.trim();
    setTextMessage("");

    setConversation((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            sender: "user",
            content: transcript,
            timestamp: new Date().toISOString(),
            isLoading: false,
          },
        ],
      };
    });

    setIsGeneratingText(true);
    
    setConversation((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            sender: "ai",
            content: "",
            timestamp: new Date().toISOString(),
            isLoading: true,
            loadingType: "text_generating",
          },
        ],
      };
    });

    sendRealtimeText(transcript);
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
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <CallHeader
              characterName={conversation?.characterId.name || ""}
              characterAvatar={conversation?.characterId.profileImage || ""}
              connectionStatus={connectionStatus}
              isConnected={isConnected}
              videosReady={videosReady}
              videosFailed={videosFailed}
              isAIResponding={isAIResponding}
              isAudioPlaying={isAudioPlaying}
            />
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={handleEndCall} style={styles.backButton}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                setRenderMode(renderMode === "video" ? "chat" : "video")
              }
              style={styles.renderModeButton}
            >
              <Ionicons
                name={renderMode === "video" ? "chatbox-ellipses" : "videocam"}
                size={24}
                color={Colors.light.text}
              />
            </TouchableOpacity>
          ),
          headerShown: !isFullScreen,
        }}
      />
      <View style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={renderMode === "chat" ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
          enabled={renderMode === "chat" && !isFullScreen}
        >
          <View style={{ flex: 1}}>
            {/* Always render video section but conditionally show it */}
            <View style={renderMode === "video" ? {} : { display: 'none' }}>
              {conversation?.characterId && (
                <VideoSection
                  character={conversation.characterId}
                  isAudioPlaying={isAudioPlaying}
                  videosReady={videosReady}
                  videosFailed={videosFailed}
                  isFullScreen={isFullScreen}
                  fullScreenAnimation={fullScreenAnimation}
                  toggleFullScreen={toggleFullScreen}
                  handleVideoLoadStart={handleVideoLoadStart}
                  handleVideoLoad={handleVideoLoad}
                  handleVideoError={handleVideoError}
                />
              )}
            </View>
            
            {/* Chat section - hide when in full screen */}
            {!isFullScreen && (
              <View style={{ 
                height: renderMode === "video" ? CHAT_HEIGHT : undefined, 
                flex: renderMode === "chat" ? 1 : undefined 
              }}>
                <MessagesSection
                  messages={conversation?.messages || []}
                  characterAvatar={conversation?.characterId.profileImage}
                  scrollViewRef={scrollViewRef}
                />
              </View>
            )}
          </View>

          <CallControls
            isFullScreen={isFullScreen}
            renderMode={renderMode}
            textMessage={textMessage}
            setTextMessage={setTextMessage}
            sendTextMessage={sendTextMessage}
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            isConnected={isConnected}
            isProcessingVoice={isProcessingVoice}
            isGeneratingText={isGeneratingText}
            isAIResponding={isAIResponding}
            isAudioPlaying={isAudioPlaying}
            handleEndCall={handleEndCall}
          />
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  renderModeButton: {
    padding: 8,
    marginRight: 16,
  },
});
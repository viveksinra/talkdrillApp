import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
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
import { ThemedText } from "@/components/ThemedText";

interface Message {
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  isChunk?: boolean;
  isLoading?: boolean;
  hidden?: boolean;
  audioData?: boolean;
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
  callType: "video";
}

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

  // State management - Simplified
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Initializing...");
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const audioBufferManager = useRef(new AudioBufferManager());
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>("");
  const hasSentFinalTranscriptRef = useRef<boolean>(false);
  const audioChunksRef = useRef<string[]>([]);
  const currentLoadingMessageIdRef = useRef<string | null>(null);

  const [renderMode, setRenderMode] = useState<"video" | "chat">("video");

  // Speech recognition event handlers using hooks
  useSpeechRecognitionEvent("start", () => {
    console.log("[SPEECH] Speech recognition started");
    hasSentFinalTranscriptRef.current = false; // Reset flag
    setIsProcessingVoice(true);
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("[SPEECH] Speech recognition ended");
    setIsRecording(false);
    setIsProcessingVoice(false);

    // Clear silence timer
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Send final transcript if we haven't already
    if (transcriptRef.current && !hasSentFinalTranscriptRef.current) {
      console.log(
        "[SPEECH] Sending final transcript on end:",
        transcriptRef.current
      );
      sendTranscriptToServer(transcriptRef.current);
      hasSentFinalTranscriptRef.current = true;
    }
  });

  useSpeechRecognitionEvent("result", (event) => {
    console.log("[SPEECH] Result event:", event);

    if (event.isFinal && event.results && event.results.length > 0) {
      // Final transcript - send to server
      const finalTranscript = event.results[0]?.transcript;
      if (finalTranscript && !hasSentFinalTranscriptRef.current) {
        console.log("[SPEECH] Final transcript:", finalTranscript);
        sendTranscriptToServer(finalTranscript);
        hasSentFinalTranscriptRef.current = true;

        // Stop recording after final result
        setTimeout(() => {
          stopRecording();
        }, 100);
      }
    } else if (event.results && event.results.length > 0) {
      // Interim transcript - update current transcript
      const interimTranscript = event.results[0]?.transcript || "";
      transcriptRef.current = interimTranscript;
      console.log("[SPEECH] Interim transcript:", interimTranscript);

      // Reset silence timer
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      // Set new silence timer
      silenceTimeoutRef.current = setTimeout(() => {
        // Silence detected - stop recording
        console.log("[SPEECH] Silence detected, stopping recording");
        if (!hasSentFinalTranscriptRef.current && transcriptRef.current) {
          sendTranscriptToServer(transcriptRef.current);
          hasSentFinalTranscriptRef.current = true;
        }
        stopRecording();
      }, 2000); // Increased to 2 seconds of silence
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("[SPEECH] Speech recognition error:", event);
    setIsRecording(false);
    Alert.alert(
      "Speech Recognition Error",
      event.message || "Failed to recognize speech. Please try again."
    );
  });

  useEffect(() => {
    console.log(
      "Starting AI Video Call with conversation ID:",
      routeConversationId
    );
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
    // Request both audio and speech recognition permissions
    const audioPermission = await Audio.requestPermissionsAsync();
    if (!audioPermission.granted) {
      Alert.alert(
        "Microphone Permission Required",
        "Please grant microphone permission to use the audio call feature."
      );
      return;
    }

    const speechPermission =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
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

    // Session events
    on("realtime_session_started", handleSessionStarted);
    on("realtime_connection_opened", handleConnectionOpened);
    on("realtime_connection_closed", handleConnectionClosed);
    on("realtime_session_created", handleSessionCreated);

    // Text events
    on("realtime_text_delta", handleTextDelta);
    on("realtime_text_complete", handleTextComplete);

    // Audio events
    on("realtime_audio_delta", handleAudioDelta);
    on("realtime_audio_complete", handleAudioComplete);

    // Response events
    on("realtime_response_complete", handleResponseComplete);
    on("realtime_error", handleRealtimeError);

    // Add new listener for AI responding start
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

      // calla function with basic filters automatically , so that ai canreply back and as end user thought that ai is initiating the conversation
      triggerAIForConversation();
  };

  function triggerAIForConversation(){
    sendRealtimeText(`Hello, first please introduce yourself and behave like a human being. 
      Please act like a teacher who will initiate the conversation and keep is going by asking questions and
      keep the conversation going for 10 minutes at least. and if user is proactive enough then you can just help them talking and practicing.
      `);
  }

  const handleTextDelta = (data: { delta: string; itemId: string }) => {
    console.log("Text delta:", data.delta);
    setIsAIResponding(true);

    // Add each chunk as a separate message
    setConversation((prev) => {
      if (!prev) return null;

      const lastMessage = prev.messages[prev.messages.length - 1];
      if (lastMessage && lastMessage.sender === "ai") {
        lastMessage.content += data.delta;
      } else {
        prev.messages.push({
          sender: "ai",
          content: data.delta,
          timestamp: new Date().toISOString(),
          isChunk: true,
        });
      }

      return {
        ...prev,
      };
    });
  };

  const handleTextComplete = (data: {
    text: string;
    itemId: string;
    conversationId: string;
  }) => {
    console.log("Text complete:", data.text);
    
    // Stop text generation loading
    setIsGeneratingText(false);
    
    // Text complete doesn't need to do anything since we're showing chunks
    // Add each chunk as a separate message
    setConversation((prev) => {
      if (!prev) return null;

      const lastMessage = prev.messages[prev.messages.length - 1];
      if (lastMessage.sender === "ai") {
        lastMessage.content = data.text;
      } else {
        prev.messages.push({
          sender: "ai",
          content: data.text,
          timestamp: new Date().toISOString(),
          isChunk: true,
        });
      }

      return {
        ...prev,
      };
    });
    scrollToBottom();
  };

  const handleAudioDelta = async (data: {
    audioData: string;
    itemId: string;
  }) => {
    // Collect audio chunks
    audioChunksRef.current.push(data.audioData);
  };

  const handleAudioComplete = async (data: {
    itemId: string;
    conversationId: string;
    text?: string;
    audioChunkCount?: number;
  }) => {
    console.log("Audio complete:", data);

    // Play merged audio
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

  // New handler for AI response start
  const handleAIRespondingStart = (data: {
    responseId: string;
    timestamp: Date;
  }) => {
    console.log("AI starting to respond:", data);
    setIsAIResponding(true);

    // Clear any existing audio chunks
    audioChunksRef.current = [];
    audioBufferManager.current.cleanup();
  };

  // Recording functions
  const startRecording = async () => {
    try {
      console.log("[SPEECH] Starting speech recognition...");

      if (!isConnected) {
        Alert.alert(
          "Not Connected",
          "Please wait for the connection to be established."
        );
        return;
      }

      if (isAIResponding) {
        // Interrupt AI response
        console.log("[SPEECH] Interrupting AI response");
        await audioBufferManager.current.stop();
        await audioBufferManager.current.cleanup();
        setIsAIResponding(false);
      }

      setIsRecording(true);
      transcriptRef.current = "";

      // Configure speech recognition options
      const options: ExpoSpeechRecognitionOptions = {
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
        requiresOnDeviceRecognition: false,
      };

      console.log("[SPEECH] Starting with options:", options);

      // Start speech recognition
      ExpoSpeechRecognitionModule.start(options);
    } catch (error) {
      console.error("[SPEECH] Error starting speech recognition:", error);
      setIsRecording(false);
      Alert.alert(
        "Error",
        "Failed to start speech recognition. Please try again."
      );
    }
  };

  const stopRecording = async () => {
    try {
      console.log("[SPEECH] Stopping speech recognition...");

      // Clear silence timer
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      setIsRecording(false);

      // Stop speech recognition
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error("[SPEECH] Error stopping speech recognition:", error);
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
      console.log("Ending realtime session");
      endRealtimeSession();
      await audioBufferManager.current.cleanup();

      if (conversation) {
        await endConversation(conversation._id);
      }

      router.back();
    } catch (error) {
      console.error("Error ending call:", error);
      router.back();
    }
  };

  const cleanup = async () => {
    console.log("Cleanup function called");

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
        console.warn("Error stopping speech recognition:", e);
      }
    }
  };

  // Helper function to send transcript to server
  const sendTranscriptToServer = (transcript: string) => {
    if (!transcript.trim()) return;

    // Add user message to UI
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
          },
        ],
      };
    });

    // Start text generation loading
    setIsGeneratingText(true);

    // Send to server
    sendRealtimeText(transcript);
    transcriptRef.current = "";
  };

  // Render methods
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.sender === "user";

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
            message.isChunk && styles.chunkBubble,
            message.isLoading && styles.loadingBubble,
          ]}
        >
          {message.isLoading ? (
            <View style={styles.messageLoadingContainer}>
              <Text style={styles.loadingText}>{message.content}</Text>
              <LoadingDots />
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userText : styles.aiText,
                ]}
              >
                {message.content}
              </Text>
              {message.audioData && (
                <View style={styles.audioIndicator}>
                  <Ionicons
                    name="volume-medium"
                    size={16}
                    color={Colors.light.text}
                  />
                </View>
              )}
            </>
          )}
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

  const HeaderTitleWithAvatar = () => (
    <View style={styles.headerTitleContainer}>
      <Image
        source={{ uri: conversation?.characterId.profileImage }}
        style={styles.headerAvatar}
        onError={(error) =>
          console.error("Header avatar loading error:", error.nativeEvent.error)
        }
        defaultSource={require("@/assets/images/default-avatar-1.jpg")}
      />
      <View>
        <ThemedText style={styles.headerName}>
          {(conversation?.characterId.name as string).length > 15 ? (conversation?.characterId.name as string).slice(0, 15) + "..." : (conversation?.characterId.name as string)}
        </ThemedText>
        <View
          style={{ flexDirection: "row", alignItems: "center", width: 200 }}
        >
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isConnected ? "#4CAF50" : "#F44336" },
            ]}
          />
          <Text style={styles.statusText}>
            {connectionStatus.length > 20
              ? connectionStatus.substring(0, 20) + "..."
              : connectionStatus}
          </Text>
          {isAIResponding && (
            <ActivityIndicator
              size="small"
              color={Colors.light.primary}
              style={styles.processingIndicator}
            />
          )}
        </View>
      </View>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      <View style={styles.recordButtonContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton,
            !isConnected && styles.disabledButton,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={!isConnected}
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={24} color="white" />
        </TouchableOpacity>
        
        {/* Circular loading indicator for voice recording */}
        {isProcessingVoice && (
          <View style={styles.circularLoader}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        )}
        
        {/* Status text */}
        {isProcessingVoice && (
          <Text style={styles.recordingStatusText}>Processing voice...</Text>
        )}
        {isGeneratingText && (
          <Text style={styles.recordingStatusText}>Generating response...</Text>
        )}
      </View>

      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
        <Ionicons name="call" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderMessages = () =>
    conversation?.messages &&
    conversation?.messages.length &&
    conversation?.messages.length > 0 ? (
      <View style={{ flex: 1 }}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={24} color="white" />
          <Text style={styles.sectionTitle}>Lecture Section</Text>
        </View>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {conversation?.messages.map((message, index) =>
            renderMessage(message, index)
          )}
        </ScrollView>
      </View>
    ) : (
      <View style={{ flex: 1 }}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={24} color="white" />
          <Text style={styles.sectionTitle}>Lecture Section</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, color: Colors.light.text }}>
            No messages yet
          </Text>
        </View>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderTitleWithAvatar />,
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
        }}
      />

      {renderMode === "video" ? (
        <View style={{ flex: 1 }}>
          <View style={{ height: 150, backgroundColor: "#155269" }}>
            <View
              style={{
                position: "relative",
                width: 100,
                height: 100,
                marginBottom: 5,
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
              }}
            >
              {conversation?.characterId.profileImage ? (
                <Image
                  source={{ uri: conversation?.characterId.profileImage }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 75,
                  }}
                />
              ) : (
                <View style={styles.characterAvatarPlaceholder}>
                  <Ionicons
                    name="person"
                    size={60}
                    color={Colors.light.primary}
                  />
                </View>
              )}
            </View>
          </View>
          {renderMessages()}
        </View>
      ) : (
        <View style={{ flex: 1 }}>{renderMessages()}</View>
      )}

      {renderControls()}
    </SafeAreaView>
  );
}

// Add LoadingDots component
const LoadingDots = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <Text style={styles.loadingDots}>{dots}</Text>;
};

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
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
  renderModeButton: {
    padding: 8,
    marginRight: 16,
  },
  processingIndicator: {
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    margin: 16,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  characterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.secondaryDark,
    borderRadius: 16,
    margin: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  characterAvatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "80%",
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
    color: "white",
  },
  aiText: {
    color: Colors.light.text,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
  },
  recordButtonContainer: {
    alignItems: "center",
    position: "relative",
  },
  recordButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  circularLoader: {
    position: "absolute",
    top: -10,
    left: -10,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  recordingStatusText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: "center",
  },
  recordingButton: {
    backgroundColor: "#F44336",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  endCallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBubble: {
    backgroundColor: Colors.light.surface,
    opacity: 0.9,
  },
  messageLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingDots: {
    fontSize: 16,
    color: Colors.light.primary,
    width: 30,
    marginLeft: 4,
  },
  audioIndicator: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  headerName: {
    fontSize: 17,
    fontWeight: "600",
  },
  onlineStatus: {
    fontSize: 12,
    color: "#4CD964", // Or your preferred online color
  },
  offlineStatus: {
    fontSize: 12,
    color: "#8E8E93", // Or your preferred offline color
  },
});

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import DeepgramService from '../../../api/services/deepgramService';
import socketService from '../../../api/services/socketService';
import { updateCallStatus } from '../../../api/services/callService';
import ThemedView from '../../ThemedView';
import ThemedText from '../../ThemedText';

interface AICallScreenProps {
  callId: string;
  userId: string;
  deepgramApiKey: string;
  onEndCall: () => void;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AICallScreen: React.FC<AICallScreenProps> = ({
  callId,
  userId,
  deepgramApiKey,
  onEndCall,
}) => {
  const [callStatus, setCallStatus] = useState<string>('connecting');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const deepgramService = useRef(new DeepgramService()).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const initializeCall = async () => {
      socketService.connect();
      
      // Initialize Deepgram
      const initialized = deepgramService.initialize(
        deepgramApiKey,
        userId,
        callId,
        handleTranscript
      );
      
      if (initialized) {
        socketService.onCallEvent('ai-response', handleAIResponse);
        updateCallStatus(callId, 'ongoing');
        setCallStatus('connected');
        startTimer();
        
        // Start listening after a short delay to ensure everything is set up
        setTimeout(() => {
          deepgramService.startListening();
          
          // Add welcome message
          addMessage({
            id: Date.now().toString(),
            text: "Hello! I'm your AI assistant. How can I help you today?",
            isUser: false,
            timestamp: new Date()
          });
        }, 1000);
      } else {
        console.error('Failed to initialize Deepgram');
        endCall();
      }
    };
    
    initializeCall();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      deepgramService.cleanup();
    };
  }, []);

  const handleTranscript = (text: string) => {
    // Add user message
    addMessage({
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    });
  };

  const handleAIResponse = (data: any) => {
    if (data.callId === callId && data.message) {
      // Add AI message
      addMessage({
        id: Date.now().toString(),
        text: data.message,
        isUser: false,
        timestamp: new Date()
      });
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // Scroll to bottom after message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Additional logic to mute microphone
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Additional logic to toggle speaker
  };

  const endCall = async () => {
    updateCallStatus(callId, 'completed');
    deepgramService.cleanup();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onEndCall();
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(seconds);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <ThemedText style={styles.callerName}>AI Assistant</ThemedText>
        <ThemedText style={styles.statusText}>
          {callStatus === 'connecting' ? 'Connecting...' : formatTime(callDuration)}
        </ThemedText>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.conversationContainer}
        contentContainerStyle={styles.conversationContent}
      >
        {messages.map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageBubble, 
              message.isUser ? styles.userBubble : styles.aiBubble
            ]}
          >
            <ThemedText style={styles.messageText}>{message.text}</ThemedText>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton, 
            styles.muteButton, 
            isMuted && styles.activeButton
          ]}
          onPress={toggleMute}
        >
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.rejectButton]}
          onPress={endCall}
        >
          <Ionicons name="call" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.controlButton, 
            styles.speakerButton, 
            isSpeakerOn && styles.activeButton
          ]}
          onPress={toggleSpeaker}
        >
          <Ionicons name="volume-high" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statusText: {
    fontSize: 16,
    marginTop: 5,
    color: '#777',
  },
  conversationContainer: {
    flex: 1,
    marginVertical: 20,
  },
  conversationContent: {
    paddingVertical: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 12,
    marginVertical: 5,
  },
  userBubble: {
    backgroundColor: '#3498db',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  aiBubble: {
    backgroundColor: '#7f8c8d',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
    transform: [{ rotate: '135deg' }],
  },
  muteButton: {
    backgroundColor: '#7f8c8d',
  },
  speakerButton: {
    backgroundColor: '#3498db',
  },
  activeButton: {
    borderWidth: 3,
    borderColor: '#2ecc71',
  },
});

export default AICallScreen; 
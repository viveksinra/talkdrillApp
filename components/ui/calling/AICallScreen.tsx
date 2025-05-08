import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSocket } from '../../../contexts/SocketContext';
import { updateCallStatus } from '../../../api/services/callService';
import { ThemedText } from '../../ThemedText';
import { ThemedView } from '../../ThemedView';

interface AICallScreenProps {
  callId: string;
  userId: string;
  deepgramApiKey: string;
  onEndCall: () => void;
}

const AICallScreen: React.FC<AICallScreenProps> = ({ callId, userId, deepgramApiKey, onEndCall }) => {
  const { sendAITranscription, onCallEvent } = useSocket();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponse, setAiResponse] = useState('Hello! How can I help you today?');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update call status to ongoing
    updateCallStatus(callId, 'ongoing');

    // Start call timer
    timerRef.current = setInterval(() => {
      setCallTime(prev => prev + 1);
    }, 1000);

    // Setup permission for recording
    setupRecording();

    // Listen for AI responses
    onCallEvent('ai-response', handleAIResponse);

    return () => {
      // Clean up
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  const setupRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: !isSpeakerOn,
      });
    } catch (err) {
      console.error('Failed to setup recording', err);
    }
  };

  const startRecording = async () => {
    try {
      if (recording) {
        await stopRecording();
      }
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsListening(true);
      
      // Auto-stop after 10 seconds of recording
      setTimeout(() => {
        if (recording) {
          stopRecording();
        }
      }, 10000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      setIsListening(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        processAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const processAudio = async (uri: string) => {
    try {
      // Here you would normally upload the audio to Deepgram or process it
      // For simplicity, we'll simulate transcription with a mock text
      const mockTranscription = "This is a simulated transcription from the audio";
      setTranscribedText(mockTranscription);
      
      // Send to AI through socket
      sendAITranscription(userId, callId, mockTranscription);
    } catch (err) {
      console.error('Failed to process audio', err);
    }
  };

  const handleAIResponse = (data: any) => {
    if (data.callId === callId) {
      setAiResponse(data.message);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleSpeaker = async () => {
    setIsSpeakerOn(!isSpeakerOn);
    
    // Update audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: isSpeakerOn, // Toggle the current value
    });
  };

  const handleEndCall = async () => {
    try {
      await updateCallStatus(callId, 'completed');
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
      onEndCall();
    } catch (err) {
      console.error('Failed to end call', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>AI Assistant</ThemedText>
        <ThemedText style={styles.callTime}>{formatTime(callTime)}</ThemedText>
      </View>
      
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Ionicons name="logo-android" size={80} color="#3498db" />
        </View>
        
        <View style={styles.transcript}>
          <ThemedText style={styles.transcriptTitle}>Transcript</ThemedText>
          {transcribedText ? (
            <ThemedText style={styles.userText}>You: {transcribedText}</ThemedText>
          ) : (
            <ThemedText style={styles.placeholder}>Speak to the AI assistant...</ThemedText>
          )}
          {aiResponse && (
            <ThemedText style={styles.aiText}>AI: {aiResponse}</ThemedText>
          )}
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, isMuted && styles.activeButton]} 
          onPress={handleToggleMute}
        >
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="white" />
          <ThemedText style={styles.buttonText}>Mute</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.recordButton, isListening && styles.recordingButton]} 
          onPress={isListening ? stopRecording : startRecording}
        >
          <Ionicons name={isListening ? "stop" : "mic"} size={32} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, isSpeakerOn && styles.activeButton]} 
          onPress={handleToggleSpeaker}
        >
          <Ionicons name="volume-high" size={24} color="white" />
          <ThemedText style={styles.buttonText}>Speaker</ThemedText>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
        <Ionicons name="call" size={24} color="white" />
        <ThemedText style={styles.buttonText}>End Call</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D3D47',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  callTime: {
    fontSize: 16,
    color: '#A1CEDC',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatar: {
    alignItems: 'center',
    marginBottom: 20,
  },
  transcript: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    flex: 1,
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  userText: {
    color: '#ECF3FF',
    marginBottom: 10,
  },
  aiText: {
    color: '#A1CEDC',
    marginBottom: 10,
  },
  placeholder: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#4A86E8',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CD964',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
});

export default AICallScreen; 
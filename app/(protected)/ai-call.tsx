import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AIModel, Topic } from '@/types';

export default function AICallScreen() {
  const router = useRouter();
  const { modelId, topicId } = useLocalSearchParams();
  
  const [model, setModel] = useState<AIModel | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [callTime, setCallTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  
  // Mock fetch model and topic data
  useEffect(() => {
    // In a real app, fetch from API
    setModel({
      id: '1',
      name: 'Teacher Emma',
      role: 'Language Teacher',
      avatar: 'https://via.placeholder.com/100',
      description: 'Patient and encouraging English teacher with 5+ years of experience.'
    });
    
    setTopic({
      id: '1',
      title: 'Airport Journey',
      description: 'Practice conversations about navigating airports and travel.',
      suitableFor: ['beginner', 'intermediate']
    });
  }, [modelId, topicId]);
  
  // Call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallTime(prevTime => prevTime + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };
  
  const handleEndCall = () => {
    // Show confirmation modal
    router.push({
      pathname: '/session-end-confirmation',
      params: { type: 'ai-call' }
    });
  };
  
  if (!model || !topic) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Connecting call...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <ThemedView style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.down" color="#FFF" />
          </TouchableOpacity>
          <ThemedText style={styles.callStatusText}>On call with {model.name}</ThemedText>
          <View style={{ width: 24 }} />
        </ThemedView>
        
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: model.avatar }}
            style={styles.avatar}
          />
          <ThemedText type="subtitle" style={styles.modelName}>{model.name}</ThemedText>
          <ThemedText style={styles.callTime}>{formatTime(callTime)}</ThemedText>
          <ThemedText style={styles.topicText}>{topic.title}</ThemedText>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.activeControlButton]}
            onPress={handleToggleMute}>
            <IconSymbol size={24} name={isMuted ? "mic.slash.fill" : "mic.fill"} color="white" />
            <ThemedText style={styles.controlText}>Mute</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleEndCall}>
            <IconSymbol size={24} name="phone.down.fill" color="white" />
            <ThemedText style={styles.controlText}>End</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.activeControlButton]}
            onPress={handleToggleSpeaker}>
            <IconSymbol size={24} name="speaker.wave.3.fill" color="white" />
            <ThemedText style={styles.controlText}>Speaker</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D3D47',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D3D47',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  callStatusText: {
    color: 'white',
    fontWeight: '500',
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  modelName: {
    color: 'white',
    fontSize: 24,
    marginBottom: 8,
  },
  callTime: {
    color: '#A1CEDC',
    fontSize: 18,
    marginBottom: 16,
  },
  topicText: {
    color: 'white',
    opacity: 0.7,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 24,
    paddingBottom: 48,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControlButton: {
    backgroundColor: '#4A86E8',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
}); 
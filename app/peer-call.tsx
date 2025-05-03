import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function PeerCallScreen() {
  const router = useRouter();
  const { peerId } = useLocalSearchParams();
  
  const [peer, setPeer] = useState({
    id: peerId || 'peer1',
    name: 'Alex',
    avatar: 'https://via.placeholder.com/100'
  });
  const [callTime, setCallTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  
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
  
  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };
  
  const handleEndCall = () => {
    // Show confirmation modal
    router.push({
      pathname: '/session-end-confirmation',
      params: { type: 'peer-call' }
    });
  };
  
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
          <ThemedText style={styles.callStatusText}>On call with {peer.name}</ThemedText>
          <View style={{ width: 24 }} />
        </ThemedView>
        
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: peer.avatar }}
            style={styles.avatar}
          />
          <ThemedText type="subtitle" style={styles.peerName}>{peer.name}</ThemedText>
          <ThemedText style={styles.callTime}>{formatTime(callTime)}</ThemedText>
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
            style={[styles.controlButton, isVideoEnabled && styles.activeControlButton]}
            onPress={handleToggleVideo}>
            <IconSymbol size={24} name={isVideoEnabled ? "video.fill" : "video.slash.fill"} color="white" />
            <ThemedText style={styles.controlText}>Video</ThemedText>
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
  peerName: {
    color: 'white',
    fontSize: 24,
    marginBottom: 8,
  },
  callTime: {
    color: '#A1CEDC',
    fontSize: 18,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 24,
    paddingBottom: 48,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
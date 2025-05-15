import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import streamService from '@/api/services/streamService';
import axios from '@/api/config/axiosConfig';
import { activateKeepAwakeAsync, deactivateKeepAwake, useKeepAwake } from 'expo-keep-awake';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Import Stream components
import { 
  StreamVideoClient, 
  StreamVideo, 
  StreamCall, 
  CallContent,
  useCallStateHooks,
  useCall
} from '@stream-io/video-react-native-sdk';

export default function PeerCallScreen() {
  const router = useRouter();
  const { peerId, callId, streamCallId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [callTime, setCallTime] = useState(0);
  const [streamClient, setStreamClient] = useState<StreamVideoClient | null>(null);
  const [streamCall, setStreamCall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use Expo's KeepAwake hook to prevent the screen from sleeping
  useKeepAwake();
  
  // Initialize Stream
  useEffect(() => {
    const initializeStream = async () => {
      try {
        setIsLoading(true);
        
        // Keep device awake during the call
        await activateKeepAwakeAsync('peerCallAwake');
        
        // Get token from backend
        const response = await streamService.getToken();
        console.log('response', response);
        
        // Initialize Stream client
        const client = await streamService.initialize(
          user?.id || '', 
          response.token, 
          response.apiKey
        );
        console.log('client', client);
        
        // Create or join call
        const call = await streamService.joinCall(streamCallId as string);
        console.log('call', call);
        
        setStreamClient(client);
        setStreamCall(call);
        setIsLoading(false);
        
        // Start timer
        const interval = setInterval(() => {
          setCallTime(prevTime => prevTime + 1);
        }, 1000);
        
        return () => {
          clearInterval(interval);
          // Clean up call on unmount
          streamService.endCall().catch(error => {
            console.error('Error ending call on unmount:', error);
          });
          // Release the keep awake lock when the call ends
          deactivateKeepAwake('peerCallAwake');
        };
      } catch (error) {
        console.error('Error initializing Stream for call:', error);
        setIsLoading(false);
        // Release the keep awake lock in case of error
        deactivateKeepAwake('peerCallAwake');
        router.back();
      }
    };
    
    initializeStream();
  }, [user?.id, streamCallId]);

  // Custom call controls component
  const CustomCallControls = () => {
    const call = useCall();
    
    const handleToggleMute = async () => {
      await call?.microphone.toggle();
    };
    
    const handleToggleVideo = async () => {
      await call?.camera.toggle();
    };
    
    const handleEndCall = async () => {
      try {
        // End call and update status
        await streamService.endCall();
        
        // Release the keep awake lock when ending the call
        deactivateKeepAwake('peerCallAwake');
        
        // Update call status in database
        await axios.put('/api/v1/call/status', {
          callId,
          status: 'completed'
        });
        
        // Navigate to end confirmation
        router.push({
          pathname: '/session-end-confirmation',
          params: { type: 'peer-call' }
        });
      } catch (error) {
        console.error('Error ending call:', error);
        router.back();
      }
    };
    
    return (
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, call?.microphone.state.status === 'disabled' && styles.activeControlButton]}
          onPress={handleToggleMute}>
          <IconSymbol size={24} name={call?.microphone.state.status === 'disabled' ? "mic.slash.fill" : "mic.fill"} color="white" />
          <ThemedText style={styles.controlText}>Mute</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}>
          <IconSymbol size={24} name="phone.down.fill" color="white" />
          <ThemedText style={styles.controlText}>End</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, call?.camera.state.status === 'disabled' && styles.activeControlButton]}
          onPress={handleToggleVideo}>
          <IconSymbol size={24} name={call?.camera.state.status === 'disabled' ? "video.slash.fill" : "video.fill"} color="white" />
          <ThemedText style={styles.controlText}>Video</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton]}
          onPress={() => call?.camera.flip()}>
          <IconSymbol size={24} name="camera.rotate.fill" color="white" />
          <ThemedText style={styles.controlText}>Flip</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Custom header component
  const CustomCallHeader = () => {
    const { useParticipantCount } = useCallStateHooks();
    const participantCount = useParticipantCount();
    
    return (
      <ThemedView style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol size={24} name="chevron.down" color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={styles.callStatusText}>On call</ThemedText>
        <ThemedText style={styles.callTime}>{formatTime(callTime)}</ThemedText>
        <ThemedText style={styles.participantCount}>Participants: {participantCount}</ThemedText>
      </ThemedView>
    );
  };
  
  if (isLoading || !streamCall || !streamClient) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Connecting to call...</ThemedText>
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
      <StreamVideo client={streamClient}>
        <StreamCall call={streamCall}>
          <ThemedView style={styles.container}>
            <CallContent
              onHangupCallHandler={() => router.back()}
              CallControls={CustomCallControls}
              // @ts-ignore
              CallTopView={CustomCallHeader}
            />
          </ThemedView>
        </StreamCall>
      </StreamVideo>
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  callStatusText: {
    color: 'white',
    fontWeight: '500',
  },
  callTime: {
    color: '#A1CEDC',
    fontSize: 14,
    marginLeft: 8,
  },
  participantCount: {
    color: 'white',
    fontSize: 14,
    marginLeft: 'auto',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 24,
    paddingBottom: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
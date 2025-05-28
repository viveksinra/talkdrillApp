import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import streamService from '@/api/services/streamService';
import { activateKeepAwakeAsync, deactivateKeepAwake, useKeepAwake } from 'expo-keep-awake';
import socketService from '@/api/services/socketService';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Import Stream components
import { 
  StreamVideo, 
  StreamCall, 
  CallContent,
  useCallStateHooks,
  Call,
  StreamVideoClient
} from '@stream-io/video-react-native-sdk';

export default function PeerCallScreen() {
  const router = useRouter();
  const { 
    peerId, 
    peerName = 'Peer',
    callId, 
    streamCallId,
    isIncoming = 'false',
    autoJoin = 'false' // New parameter for auto-joining from matching
  } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [callTime, setCallTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [callState, setCallState] = useState<{
    client: StreamVideoClient | null;
    call: Call | null;
  }>({
    client: null,
    call: null
  });
  
  // Use Expo's KeepAwake hook to prevent the screen from sleeping
  useKeepAwake();
  
  // Timer for call duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState.call) {
      timer = setInterval(() => {
        setCallTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState.call]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Initialize call
  useEffect(() => {
    const initializeCall = async () => {
      try {
        setIsLoading(true);
        
        // Get token from backend
        const response = await streamService.getToken();
        
        // Initialize Stream client
        const client = await streamService.ensureInitialized(
          user?.id || '',
          user?.name,
          user?.profileImage
        );
        
        // Join the call
        const call = await streamService.joinCall(streamCallId as string);
        
        setCallState({
          client,
          call
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error setting up call:', error);
        Alert.alert(
          'Connection Error',
          'Failed to connect to the call. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    };
    
    initializeCall();
    
    // Cleanup when component unmounts
    return () => {
      // End call if still active
      const call = streamService.getCall();
      if (call) {
        try {
          call.leave();
        } catch (e) {
          console.error('Error leaving call:', e);
        }
      }
      
      // Clean up stream service
      streamService.cleanup();
    };
  }, []);
  
  // Function to safely end call with confirmation
  const handleEndCall = () => {
    // Skip confirmation if this was an auto-joined match call
    if (autoJoin === 'true') {
      endCallImmediately();
      return;
    }
    
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: endCallImmediately
        }
      ]
    );
  };
  
  const endCallImmediately = async () => {
    try {
      const call = streamService.getCall();
      if (call) {
        // Disable camera and microphone before ending
        if (call.camera) {
          await call.camera.disable();
        }
        if (call.microphone) {
          await call.microphone.disable();
        }
        
        // End the call
        await streamService.endCall();
        
        // Notify about call ending via socket
        socketService.emit('call_ended', { 
          userId: user?.id,
          callId 
        });
        
        console.log('Call ended successfully');
      }
      router.back();
    } catch (error) {
      console.error('Error ending call:', error);
      router.back();
    }
  };
  
  // Custom header component
  const CustomCallHeader = () => {
    const { useParticipantCount } = useCallStateHooks();
    const participantCount = useParticipantCount();
    
    return (
      <ThemedView style={styles.topBar}>
        <TouchableOpacity onPress={handleEndCall}>
          <IconSymbol size={24} name="chevron.down" color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={styles.callStatusText}>On call</ThemedText>
        <ThemedText style={styles.callTime}>{formatTime(callTime)}</ThemedText>
        <ThemedText style={styles.participantCount}>Participants: {participantCount}</ThemedText>
      </ThemedView>
    );
  };
  
  if (isLoading || !callState.call || !callState.client) {
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
      <StreamVideo client={callState.client}>
        <StreamCall call={callState.call}>
          <ThemedView style={styles.container}>
            <CallContent
              onHangupCallHandler={handleEndCall}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  callStatusText: {
    color: 'white',
    marginLeft: 16,
    fontWeight: 'bold',
  },
  callTime: {
    color: 'white',
    marginLeft: 'auto',
    marginRight: 16,
  },
  participantCount: {
    color: 'white',
    fontSize: 12,
  },
}); 
import { StyleSheet, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
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
import { Colors } from '@/constants/Colors';

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
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');
  const [connectionAttempt, setConnectionAttempt] = useState(0);
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
    // Socket event handlers
    const handlePartnerPreparing = (data: any) => {
      console.log('Partner is preparing to join the call:', data);
    };
    
    // Set up socket listeners
    socketService.on('partner_preparing', handlePartnerPreparing);
    
    const initializeCall = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus('Initializing connection...');
        
        // For automatic joining from match-making, add a small delay
        if (autoJoin === 'true') {
          console.log('Auto-join mode active, adding initial delay for synchronization');
          setConnectionStatus('Synchronizing with partner...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('Initializing call with parameters:', {
          peerId, 
          peerName, 
          callId, 
          streamCallId,
          isIncoming,
          autoJoin
        });
        
        // Get token from backend
        setConnectionStatus('Getting authentication token...');
        const response = await streamService.getToken();
        console.log('Received Stream token');
        
        // Initialize Stream client
        setConnectionStatus('Initializing video service...');
        const client = await streamService.ensureInitialized(
          user?.id || '',
          user?.name,
          user?.profileImage
        );
        console.log('Stream client initialized');
        
        // Try joining the call with retries
        let call = null;
        let joinError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            setConnectionAttempt(attempt);
            setConnectionStatus(`Joining call (attempt ${attempt}/3)...`);
            console.log(`Attempting to join call (attempt ${attempt}/3)`);
            
            // Join the call
            call = await streamService.joinCall(streamCallId as string);
            console.log('Successfully joined call on attempt', attempt);
            joinError = null;
            break;
          } catch (error: any) {
            joinError = error;
            console.error(`Error joining call on attempt ${attempt}:`, error);
            
            // Check if it's the "Illegal State" error, which means we're actually already joined
            if (error.message && error.message.includes('Illegal State')) {
              console.log('Detected "Illegal State" error - treating as success');
              setConnectionStatus('Already connected to call');
              
              // Try to get the current call directly
              call = streamService.getCall();
              if (call) {
                joinError = null;
                break;
              }
            }
            
            // Wait between attempts with increasing delay
            if (attempt < 3) {
              const delay = 1000 * attempt;
              setConnectionStatus(`Retrying in ${delay/1000} seconds...`);
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              setConnectionStatus('Failed to join call');
            }
          }
        }
        
        if (joinError) {
          throw joinError;
        }
        
        if (!call) {
          throw new Error('Failed to join call after multiple attempts');
        }
        
        setConnectionStatus('Successfully joined call');
        
        // By default, start with camera off but microphone on
        try {
          await call.camera.disable();
          await call.microphone.enable();
          console.log('Default call settings applied: camera off, microphone on');
        } catch (mediaError) {
          console.warn('Error setting default media state:', mediaError);
        }
        
        setCallState({
          client,
          call
        });
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error setting up call:', error);
        const errorMessage = error.message || 'Unknown error';
        
        // Format a user-friendly error message
        let friendlyError = 'Failed to connect to the call.';
        if (errorMessage.includes('Illegal State')) {
          friendlyError = 'Error: Already connected to this call in another window.';
        } else if (errorMessage.includes('state')) {
          friendlyError = 'Error: Call state is invalid. Please try again.';
        }
        
        Alert.alert(
          'Connection Error',
          friendlyError,
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
      // Remove socket listeners
      socketService.off('partner_preparing', handlePartnerPreparing);
      
      // End call if still active
      const call = streamService.getCall();
      if (call) {
        try {
          console.log('Leaving call during component unmount');
          call.leave();
        } catch (e) {
          console.error('Error leaving call during cleanup:', e);
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
        <ActivityIndicator size="large" color={Colors.light.primary} style={styles.loader} />
        <ThemedText style={styles.loadingText}>{connectionStatus}</ThemedText>
        {connectionAttempt > 0 && (
          <ThemedText style={styles.attemptText}>Attempt {connectionAttempt}/3</ThemedText>
        )}
        
        {/* Add manual retry button if we're having trouble connecting */}
        {connectionAttempt >= 2 && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setConnectionStatus('Retrying connection...');
              setConnectionAttempt(0);
              
              // Reset connection status and restart call joining logic
              const initCall = async () => {
                try {
                  setIsLoading(true);
                  
                  // Get a clean client
                  const response = await streamService.getToken();
                  const client = await streamService.ensureInitialized(
                    user?.id || '',
                    user?.name,
                    user?.profileImage
                  );
                  
                  // Try joining again
                  setConnectionStatus('Joining call after manual retry...');
                  const call = await streamService.joinCall(streamCallId as string);
                  
                  setCallState({
                    client,
                    call
                  });
                  
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error in manual retry:', error);
                  setConnectionStatus('Connection failed after manual retry');
                  
                  // Show error alert
                  Alert.alert(
                    'Connection Failed',
                    'Could not connect to the call after manual retry. Please try again later.',
                    [
                      {
                        text: 'OK',
                        onPress: () => router.back()
                      }
                    ]
                  );
                }
              };
              
              initCall();
            }}
          >
            <ThemedText style={styles.retryButtonText}>Try Manual Connection</ThemedText>
          </TouchableOpacity>
        )}
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
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    color: 'white',
    fontWeight: 'bold',
  },
  attemptText: {
    color: 'white',
    fontSize: 12,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import streamService from '@/api/services/streamService';
import { activateKeepAwakeAsync, deactivateKeepAwake, useKeepAwake } from 'expo-keep-awake';

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
    isIncoming = 'false' 
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
  
  // Initialize call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const setupCall = async () => {
      try {
        setIsLoading(true);
        
        // Keep device awake during call
        await activateKeepAwakeAsync('peerCallAwake');
        
        // Initialize with current authenticated user, not peer
        const client = await streamService.ensureInitialized(
          user?.id || '', 
          user?.name, 
          user?.profileImage
        );
        
        let call;
        
        if (isIncoming === 'true' && streamCallId) {
          // For incoming calls, join the existing call
          call = await streamService.joinCall(streamCallId as string);
          console.log('Joined incoming call:', streamCallId);
          
          // Add a delay after joining to ensure connection is established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check participants after joining and log for debugging
          console.log('Initial participants after joining:', call.state.participants);
          
          // Force a state update to reconnect if needed
          if (Object.keys(call.state.participants).length < 2) {
            console.log('Attempting to reconnect to call with insufficient participants');
            await call.leave();
            call = await streamService.joinCall(streamCallId as string);
          }
        } else if (streamCallId) {
          // For outgoing calls that were already initiated
          call = streamService.getCall();
          
          // If call isn't already active, rejoin it
          if (!call) {
            call = await streamService.joinCall(streamCallId as string);
            console.log('Rejoined outgoing call:', streamCallId);
          }
        } else {
          throw new Error("No valid streamCallId provided");
        }
        
        // Ensure audio-only mode
        if (call && call.camera) {
          await call.camera.disable();
        }
        
        setCallState({ client, call });
        setIsLoading(false);
        
        // Debug logging
        console.log('Call setup complete, participants:', call.state.participants);
        
        // Start timer
        interval = setInterval(() => {
          setCallTime(prevTime => prevTime + 1);
        }, 1000);
      } catch (error) {
        console.error('Error setting up call:', error);
        Alert.alert('Error', 'Could not connect to call. Please try again later.');
        setIsLoading(false);
        deactivateKeepAwake('peerCallAwake');
        router.back();
      }
    };
    
    setupCall();
    
    return () => {
      if (interval) clearInterval(interval);
      
      // Clean up call on unmount
      const call = streamService.getCall();
      if (call) {
        call.camera.disable().catch(e => console.error("Error disabling camera:", e));
        call.microphone.disable().catch(e => console.error("Error disabling mic:", e));
        
        streamService.endCall().catch(error => {
          console.error('Error ending call on unmount:', error);
        });
      }
      
      deactivateKeepAwake('peerCallAwake');
    };
  }, [user?.id, streamCallId, isIncoming]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Function to safely end call with confirmation
  const handleEndCall = () => {
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
          onPress: async () => {
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
                console.log('Call ended successfully');
              }
              router.back();
            } catch (error) {
              console.error('Error ending call:', error);
              router.back();
            }
          }
        }
      ]
    );
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
  participantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 100,
    left: 20,
    zIndex: 10,
  },
  participantImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
  initialsContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A86E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  initialsText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  participantName: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
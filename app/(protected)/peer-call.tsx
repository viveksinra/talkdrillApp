import { StyleSheet, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import streamService from '@/api/services/streamService';
import { useKeepAwake } from 'expo-keep-awake';
import socketService from '@/api/services/socketService';
import { DEFAULT_CALL_LIMIT, put } from '@/api/config/axiosConfig';
import { post } from '@/api/config/axiosConfig';

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

// Import SessionTimer and ExtendCallButton components
import { SessionTimer } from '@/components/SessionTimer';
import { ExtendCallButton } from '@/components/ExtendCallButton';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ToastAndroid, Platform } from 'react-native';
import { deductCoins, createPeerCallTransaction } from '@/api/services/coinService';

// Add toast utility function
const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    // For iOS, you might want to use a toast library or alert as fallback
    Alert.alert('Info', message);
  }
};

// Helper function to format time display
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function PeerCallScreen() {
  const router = useRouter();
  const { 
    peerId, 
    peerName = 'Peer',
    callId, 
    streamCallId,
    isIncoming = 'false',
    autoJoin = 'false',
    durationInMinutes = DEFAULT_CALL_LIMIT.toString(),
    coinCostPer5Min = '5' // Add coin cost parameter
  } = useLocalSearchParams();
  const { user } = useAuth();
  
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
  
  const [coinsSpentThisCall, setCoinsSpentThisCall] = useState(0);
  const callStartTimeRef = useRef<Date | null>(null);
  const minuteTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Parse durationInMinutes to ensure it's a number and apply default if needed
  const parsedDurationInMinutes = useMemo(() => {
    const parsed = parseInt(durationInMinutes as string, 10);
    return isNaN(parsed) ? DEFAULT_CALL_LIMIT : parsed;
  }, [durationInMinutes]);
  
  // Parse coinCostPer5Min to ensure it's a number
  const parsedCoinCostPer5Min = useMemo(() => {
    const parsed = parseInt(coinCostPer5Min as string, 10);
    return isNaN(parsed) ? 5 : parsed;
  }, [coinCostPer5Min]);
  
  // Use Expo's KeepAwake hook to prevent the screen from sleeping
  useKeepAwake();
  
  // Add this single line to prevent race conditions:
  const isInitializing = useRef(false);
  
  // Initialize call
  useEffect(() => {
    // Add this check at the very beginning:
    if (isInitializing.current) {
      console.log('Already initializing, skipping...');
      return;
    }
    isInitializing.current = true;
    
    const handlePartnerPreparing = (data: any) => {
      console.log('Partner preparing:', data);
    };
    
    // Set up socket listeners
    socketService.on('partner_preparing', handlePartnerPreparing);
    
    const initializeCall = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus('Initializing connection...');
        
        // For automatic joining from match-making, add a small delay
        if (autoJoin === 'true') {
          setConnectionStatus('Synchronizing with partner...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Get token from backend
        setConnectionStatus('Getting authentication token...');
        const response = await streamService.getToken();
       
        // Initialize Stream client
        setConnectionStatus('Initializing video service...');
        const client = await streamService.ensureInitialized(
          user?.id || '',
          user?.name,
          user?.profileImage
        );
       
        // Try joining the call with retries
        let call = null;
        let joinError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            setConnectionAttempt(attempt);
            setConnectionStatus(`Joining call (attempt ${attempt}/3)...`);
            
            // Join the call with proper duration setting
            call = await streamService.joinCall(streamCallId as string);
            
            // Check if call was created with proper duration limit
            console.log('Call settings:', call.state.settings);
            
            joinError = null;
            break;
          } catch (error: any) {
            joinError = error;
            console.error(`Error joining call on attempt ${attempt}:`, error);
            
            // Check if it's the "Illegal State" error, which means we're actually already joined
            if (error.message && error.message.includes('Illegal State')) {
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
        
        // Set up GetStream event listeners for call management
        setupCallEventListeners(call);
        
        // By default, start with camera off but microphone on
        try {
          await call.camera.disable();
          await call.microphone.enable();
        } catch (mediaError) {
          console.warn('Error setting default media state:', mediaError);
        }
        
        setCallState({
          client,
          call
        });
        
        // Start coin timer after successful call setup
        startCoinTimer();
        
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
              onPress: () => router.replace('/(protected)/(tabs)')
            }
          ]
        );
      }
    };
    
    initializeCall();
    
    // Cleanup when component unmounts
    return () => {
      // Add this line to reset the flag:
      isInitializing.current = false;
      
      // Remove socket listeners
      socketService.off('partner_preparing', handlePartnerPreparing);
      
      // End call if still active
      const call = streamService.getCall();
      if (call) {
        try {
          call.leave();
        } catch (e) {
          // console.error('Error leaving call during cleanup:', e);
        }
      }
      
      // Clean up stream service
      streamService.cleanup();
      stopCoinTimer(); // Ensure coin timer is stopped
    };
  }, [streamCallId, autoJoin, user?.id, user?.name, user?.profileImage]);
  
  // Set up GetStream event listeners
  const setupCallEventListeners = (call: Call) => {
    // Listen for call ended event (GetStream built-in)
    call.on('call.ended', (event: any) => {
      console.log('Call ended by GetStream:', event);
      const endedByUser = event.user ? event.user.name || event.user.id : 'system';
      const isItMe = event.user.id === user?.id;
      if(isItMe){
        router.replace('/(protected)/(tabs)');
        return;
      }
      Alert.alert(
        'Call Ended',
        `The call has been ended by ${endedByUser}.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(protected)/(tabs)')
          }
        ]
      );
    });
    
    // Listen for session ended event (GetStream built-in)
    call.on('call.session_ended', (event: any) => {
      console.log('Call session ended:', event);
      // Alert.alert(
      //   'Session Ended',
      //   'The call session has ended.',
      //   [
      //     {
      //       text: 'OK',
      //       onPress: () => router.back()
      //     }
      //   ]
      // );
    });
    
    // Listen for participant left events
    call.on('call.session_participant_left', (event: any) => {
      console.log('Participant left:', event);
      // You can add logic here if needed when other participants leave
    });
  };
  
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
      // Handle early termination (< 5 minutes)
      if (callStartTimeRef.current) {
        const callDuration = Date.now() - callStartTimeRef.current.getTime();
        const fiveMinutesInMs = 5 * 60 * 1000;
        
        // If call lasted less than 5 minutes and no coins deducted yet
        if (callDuration < fiveMinutesInMs && coinsSpentThisCall === 0) {
          try {
            console.log('[PEER-COIN-TIMER] Early termination, deducting minimum coins');
            await deductCoins(parsedCoinCostPer5Min);
            setCoinsSpentThisCall(parsedCoinCostPer5Min);
          } catch (error) {
            console.warn('Could not deduct minimum coins on early end:', error);
          }
        }
      }
      
      stopCoinTimer(); // Stop coin timer on call end
      await createFinalTransaction(); // Create final transaction on call end

      const call = streamService.getCall();
      if (call) {
        // Disable camera and microphone before ending
        if (call.camera) {
          await call.camera.disable();
        }
        if (call.microphone) {
          await call.microphone.disable();
        }
        
        // Use GetStream's built-in endCall() method
        await call.endCall();
        
        // Update call status in backend
        if (callId) {
          try {
            await put('/api/v1/call/status', {
              callId,
              status: 'completed'
            });
          } catch (error) {
            console.error('Error updating call status in backend:', error);
          }
        }
      }
      router.replace('/(protected)/(tabs)');
    } catch (error) {
      console.error('Error ending call:', error);
      router.replace('/(protected)/(tabs)');
    }
  };

  // Coin timer functions
  const startCoinTimer = () => {
    console.log(`[PEER-COIN-TIMER] Starting coin timer: ${parsedCoinCostPer5Min} coins per 5min`);
    callStartTimeRef.current = new Date();
    
    // Start 5-minute timer for coin deduction
    minuteTimerRef.current = setInterval(async () => {
      try {
        console.log(`[PEER-COIN-TIMER] Deducting ${parsedCoinCostPer5Min} coins for 5-minute usage`);
        await deductCoins(parsedCoinCostPer5Min);
        setCoinsSpentThisCall(prev => prev + parsedCoinCostPer5Min);
        console.log('[PEER-COIN-TIMER] Coins deducted successfully');
      } catch (error: any) {
        console.error('[PEER-COIN-TIMER] Error deducting coins:', error);
        
        // Check if it's insufficient balance error
        if (error.message && error.message.includes('Insufficient coins')) {
          // Stop the timer immediately to prevent further deductions
          stopCoinTimer();
          showToast("Insufficient coins to continue the peer call");
          setTimeout(() => handleEndCall(), 2000); // Give time for toast to show
          return;
        }
        
        // For other errors, continue but log
        console.warn('[PEER-COIN-TIMER] Continuing call despite coin deduction error');
      }
    }, 300000); // Every 5 minutes (300000ms)
  };

  const stopCoinTimer = () => {
    console.log('[PEER-COIN-TIMER] Stopping coin timer');
    if (minuteTimerRef.current) {
      clearInterval(minuteTimerRef.current);
      minuteTimerRef.current = null;
    }
  };

  const createFinalTransaction = async () => {
    if (coinsSpentThisCall > 0 && callId) {
      try {
        console.log('[PEER-COIN-TIMER] Creating final transaction for', coinsSpentThisCall, 'coins');
        await createPeerCallTransaction(callId as string, coinsSpentThisCall, parsedCoinCostPer5Min);
        console.log('[PEER-COIN-TIMER] Final transaction created successfully');
      } catch (error) {
        console.error('[PEER-COIN-TIMER] Error creating final transaction:', error);
        // Don't block call end for transaction creation errors
        console.warn('[PEER-COIN-TIMER] Call ended without recording final transaction');
      }
    } else {
      console.log('[PEER-COIN-TIMER] No coins spent or call ID missing, skipping final transaction');
    }
  };
  
  // Custom header component with synchronized timer display
  const CustomCallHeader = () => {
    const { useParticipantCount, useCallSession } = useCallStateHooks();
    const participantCount = useParticipantCount();
    const session = useCallSession();
    
    // Calculate synchronized elapsed time from session start
    const [elapsedTime, setElapsedTime] = useState(0);
    
    useEffect(() => {
      const updateElapsed = () => {
        if (!session?.started_at) return;
        console.log('Session started at:', session.started_at);
        const startTime = new Date(session.started_at);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      };
      
      // Update immediately
      updateElapsed();
      
      // Then update every second
      const timer = setInterval(updateElapsed, 1000);
      
      return () => clearInterval(timer);
    }, [session?.started_at]);
    
    return (
      <ThemedView style={styles.topBar}>
        <TouchableOpacity onPress={handleEndCall}>
          <IconSymbol size={24} name="xmark" color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={styles.callStatusText}>On call</ThemedText>
        <SessionTimer durationMinutes={parsedDurationInMinutes} />
        <ThemedText style={styles.durationInfo}>
          Limit: {parsedDurationInMinutes}min
        </ThemedText>
        <ThemedText style={styles.coinInfo}>
          {parsedCoinCostPer5Min} coins/5min
        </ThemedText>
        {/* <ThemedText style={styles.participantCount}>
          Participants: {participantCount}
        </ThemedText> */}
      </ThemedView>
    );
  };
  
  const handleRetryConnection = async () => {
    setConnectionStatus('Retrying connection...');
    setConnectionAttempt(0);
    
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
      
      // Set up event listeners for the new call
      setupCallEventListeners(call);
      
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
            onPress: () => router.replace('/(protected)/(tabs)')
          }
        ]
      );
    }
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
            onPress={handleRetryConnection}
          >
            <ThemedText style={styles.retryButtonText}>Try Manual Connection</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    );
  }
  
  return (
    <>
    <SafeAreaView style={{flex:1}}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <GestureHandlerRootView>
      <StreamVideo client={callState.client}>
        <StreamCall call={callState.call}>
          <ThemedView style={styles.container}>
            <CustomCallHeader />
            <CallContent
              onHangupCallHandler={handleEndCall}
            />
            {/* <View style={styles.extendButtonContainer}>
              <ExtendCallButton durationMinutesToExtend={10} />
            </View> */}
          </ThemedView>
        </StreamCall>
      </StreamVideo>
      </GestureHandlerRootView>
    </SafeAreaView>
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
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexWrap: 'wrap',
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
  durationInfo: {
    color: 'white',
    fontSize: 10,
    marginRight: 8,
    marginLeft: 8,
    opacity: 0.8,
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
    marginBottom: 8,
  },
  attemptText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  extendButtonContainer: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    zIndex: 1000,
  },
  coinInfo: {
    color: 'white',
    fontSize: 10,
    marginRight: 8,
    marginLeft: 8,
    opacity: 0.8,
  },
}); 
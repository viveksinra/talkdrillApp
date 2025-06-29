import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Alert,
  ActivityIndicator,
  Text
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '../../constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import streamService from '@/api/services/streamService';
import professionalSessionService from '@/api/services/professionalSessionService';

// Import Stream components
import { 
  StreamVideo, 
  StreamCall, 
  CallContent,
  useCallStateHooks,
  Call,
  StreamVideoClient
} from '@stream-io/video-react-native-sdk';

export default function ProfessionalSessionCallScreen() {
  const router = useRouter();
  const { 
    sessionId,
    bookingId,
    streamCallId,
    professionalId,
    professionalName,
    durationInMinutes = '60'
  } = useLocalSearchParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');
  const [callState, setCallState] = useState<{
    client: StreamVideoClient | null;
    call: Call | null;
  }>({
    client: null,
    call: null
  });
  const [callDuration, setCallDuration] = useState(0);
  const [sessionEndTime, setSessionEndTime] = useState<moment.Moment | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showEndWarning, setShowEndWarning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [professionalDisconnected, setProfessionalDisconnected] = useState(false);
  
  const isInitializing = useRef(false);
  const callDurationTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionEndTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Use Expo's KeepAwake hook to prevent the screen from sleeping
  useKeepAwake();

  const parsedDurationInMinutes = parseInt(durationInMinutes as string, 10) || 60;

  // Initialize call
  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    const initializeCall = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus('Joining professional session...');

        // Join the professional session
        const joinResponse = await professionalSessionService.joinSessionCall(bookingId as string);
        
        setConnectionStatus('Getting authentication token...');
        const client = await streamService.ensureInitialized(
          user?.id || '',
          user?.name,
          user?.profileImage
        );

        setConnectionStatus('Connecting to session...');
        const call = await streamService.joinCall(joinResponse.streamCallId);

        // Set session end time
        const endTime = moment().add(parsedDurationInMinutes, 'minutes');
        setSessionEndTime(endTime);

        // Set up call event listeners
        setupCallEventListeners(call);

        // Set up socket listeners for session events
        setupSocketListeners();

        // Set default media state (camera on, microphone on for student)
        try {
          await call.camera.enable();
          await call.microphone.enable();
        } catch (mediaError) {
          console.warn('Error setting default media state:', mediaError);
        }

        setCallState({
          client,
          call
        });

        setIsLoading(false);
        setConnectionStatus('Connected');
      } catch (error: any) {
        console.error('Error setting up professional session call:', error);
        Alert.alert(
          'Connection Error',
          'Failed to join the professional session. Please try again.',
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

    return () => {
      isInitializing.current = false;
      if (callDurationTimer.current) clearInterval(callDurationTimer.current);
      if (sessionEndTimer.current) clearInterval(sessionEndTimer.current);
      
      const call = streamService.getCall();
      if (call) {
        try {
          call.leave();
        } catch (e) {
          console.warn('Error leaving call during cleanup:', e);
        }
      }
      streamService.cleanup();
    };
  }, [bookingId, streamCallId, user?.id, parsedDurationInMinutes]);

  // Set up GetStream event listeners
  const setupCallEventListeners = (call: Call) => {
    call.on('call.ended', (event: any) => {
      console.log('Professional session call ended:', event);
      handleCallEnd(event.user ? event.user.name || event.user.id : 'system');
    });

    call.on('call.session_participant_left', (event: any) => {
      console.log('Professional left session:', event);
      if (event.user.id !== user?.id) {
        setProfessionalDisconnected(true);
        Alert.alert(
          'Professional Disconnected',
          'Your professional has disconnected. They may reconnect shortly.',
          [{ text: 'OK' }]
        );
      }
    });

    call.on('call.session_participant_joined', (event: any) => {
      console.log('Professional rejoined session:', event);
      if (event.user.id !== user?.id) {
        setProfessionalDisconnected(false);
        Alert.alert(
          'Professional Reconnected',
          'Your professional has reconnected to the session.',
          [{ text: 'OK' }]
        );
      }
    });

    call.on('call.recording_started', () => {
      setIsRecording(true);
    });

    call.on('call.recording_stopped', () => {
      setIsRecording(false);
    });
  };

  // Set up socket listeners for session events
  const setupSocketListeners = () => {
    if (!socket || !isConnected) return;

    const handleSessionEndingSoon = (data: any) => {
      if (data.bookingId === bookingId) {
        setShowEndWarning(true);
        Alert.alert(
          'Session Ending Soon',
          `Your session will end in ${data.minutesLeft} minutes`,
          [{ text: 'OK' }]
        );
      }
    };

    const handleSessionAutoEnd = (data: any) => {
      if (data.bookingId === bookingId) {
        Alert.alert(
          'Session Time Up',
          'Your session time has ended. The call will be terminated.',
          [
            {
              text: 'OK',
              onPress: () => endSessionCall('session_time_up')
            }
          ]
        );
      }
    };

    const handleChatMessage = (data: any) => {
      if (data.bookingId === bookingId) {
        setChatMessages(prev => [...prev, data.message]);
      }
    };

    socket.on('session_ending_soon', handleSessionEndingSoon);
    socket.on('session_auto_end', handleSessionAutoEnd);
    socket.on('session_chat_message', handleChatMessage);

    return () => {
      socket.off('session_ending_soon', handleSessionEndingSoon);
      socket.off('session_auto_end', handleSessionAutoEnd);
      socket.off('session_chat_message', handleChatMessage);
    };
  };

  // Timer for call duration and session end
  useEffect(() => {
    if (!isLoading && callState.call && sessionEndTime) {
      callDurationTimer.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      sessionEndTimer.current = setInterval(() => {
        const now = moment();
        const remaining = sessionEndTime.diff(now);
        
        if (remaining <= 0) {
          setTimeRemaining('00:00');
          endSessionCall('session_time_up');
        } else {
          const duration = moment.duration(remaining);
          const minutes = Math.floor(duration.asMinutes());
          const seconds = duration.seconds();
          setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          
          // Show warning at 5 minutes
          if (remaining <= 5 * 60 * 1000 && !showEndWarning) {
            setShowEndWarning(true);
          }
        }
      }, 1000);

      return () => {
        if (callDurationTimer.current) clearInterval(callDurationTimer.current);
        if (sessionEndTimer.current) clearInterval(sessionEndTimer.current);
      };
    }
  }, [isLoading, callState.call, sessionEndTime, showEndWarning]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCallEnd = (endedBy: string) => {
    const isItMe = endedBy === user?.id;
    if (isItMe) {
      // Navigate to review screen
      navigateToReviewScreen();
      return;
    }
    Alert.alert(
      'Session Ended',
      `The session has been ended by ${endedBy}.`,
      [
        {
          text: 'OK',
          onPress: () => navigateToReviewScreen()
        }
      ]
    );
  };

  const navigateToReviewScreen = () => {
    router.replace({
      pathname: '/session-review/[bookingId]',
      params: {
        bookingId: bookingId as string,
        sessionId: sessionId as string,
        professionalId: professionalId as string,
        professionalName: professionalName as string
      }
    });
  };

  const endSessionCall = async (endReason: string = 'ended_by_student') => {
    try {
      const call = streamService.getCall();
      if (call) {
        await call.endCall();
      }
      
      // End session on backend
      await professionalSessionService.endSession(bookingId as string, endReason);
      
      // Navigate to review screen
      navigateToReviewScreen();
    } catch (error) {
      console.error('Error ending session call:', error);
      // Navigate to review screen anyway
      navigateToReviewScreen();
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end the session? You will be asked to rate your experience.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => endSessionCall('ended_by_student')
        }
      ]
    );
  };

  const handleDisconnection = async () => {
    try {
      await professionalSessionService.handleDisconnection(bookingId as string, 'connection_lost');
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  };

  const CustomCallControls = () => {
    const { useCallCallingState, useCameraState, useMicrophoneState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const { camera, isMute: isCameraMute } = useCameraState();
    const { microphone, status: micStatus } = useMicrophoneState();

    return (
      <View style={styles.callControls}>
        <View style={styles.callInfoContainer}>
          <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          <Text style={styles.timeRemaining}>Remaining: {timeRemaining}</Text>
          <Text style={styles.professionalName}>with {professionalName}</Text>
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording</Text>
            </View>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isCameraMute ? Colors.light.error : Colors.light.surface }]}
            onPress={() => camera.toggle()}
          >
            <Ionicons 
              name={isCameraMute ? 'videocam-off' : 'videocam'} 
              size={24} 
              color={isCameraMute ? Colors.light.background : Colors.light.text} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: micStatus === 'disabled' ? Colors.light.error : Colors.light.surface }]}
            onPress={() => microphone.toggle()}
          >
            <Ionicons 
              name={micStatus === 'disabled' ? 'mic-off' : 'mic'} 
              size={24} 
              color={micStatus === 'disabled' ? Colors.light.background : Colors.light.text} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: showChat ? Colors.light.primary : Colors.light.surface }]}
            onPress={() => setShowChat(!showChat)}
          >
            <Ionicons 
              name="chatbubble" 
              size={24} 
              color={showChat ? Colors.light.background : Colors.light.text} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endButton]}
            onPress={handleEndCall}
          >
            <Ionicons name="call" size={24} color={Colors.light.background} />
          </TouchableOpacity>
        </View>

        {showEndWarning && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color={Colors.light.warning} />
            <Text style={styles.warningText}>Session ends in 5 minutes</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>{connectionStatus}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!callState.call || !callState.client) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
          <ThemedText style={styles.errorText}>Failed to connect to the session</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StreamVideo client={callState.client}>
        <StreamCall call={callState.call}>
          <View style={styles.callContainer}>
            <CallContent 
              onHangupCallHandler={handleEndCall}
              CallControls={CustomCallControls}
            />
            {professionalDisconnected && (
              <View style={styles.reconnectingOverlay}>
                <View style={styles.reconnectingContainer}>
                  <ActivityIndicator size="large" color={Colors.light.primary} />
                  <Text style={styles.reconnectingText}>Waiting for professional to reconnect...</Text>
                </View>
              </View>
            )}
          </View>
        </StreamCall>
      </StreamVideo>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600'
  },
  callContainer: {
    flex: 1
  },
  callControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40
  },
  callInfoContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  callDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.background,
    marginBottom: 4
  },
  timeRemaining: {
    fontSize: 14,
    color: Colors.light.background,
    opacity: 0.8
  },
  professionalName: {
    fontSize: 14,
    color: Colors.light.background,
    opacity: 0.9,
    marginTop: 2
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.error
  },
  recordingText: {
    fontSize: 12,
    color: Colors.light.background,
    opacity: 0.8
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.surface
  },
  endButton: {
    backgroundColor: Colors.light.error
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 8
  },
  warningText: {
    fontSize: 14,
    color: Colors.light.warning,
    fontWeight: '500'
  },
  reconnectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  reconnectingContainer: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 12
  },
  reconnectingText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center'
  }
}); 
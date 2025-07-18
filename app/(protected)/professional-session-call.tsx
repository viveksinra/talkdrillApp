import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Alert,
  ActivityIndicator,
  Text,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import moment from 'moment';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '../../constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import streamService from '@/api/services/streamService';
import {joinProfessionalSessionCall, endProfessionalSessionCall} from '@/api/services/callService';

// Import Stream components
import { 
  StreamVideo, 
  StreamCall, 
  CallContent,
  useCallStateHooks,
  Call,
  StreamVideoClient
} from '@stream-io/video-react-native-sdk';
import callService from '@/api/services/callService';
import { PDFModal } from '@/components/PDFModal';
import { SessionChat } from '@/components/shared/SessionChat';

// Add this interface near the top after existing interfaces
interface PDFFile {
  name: string;
  url: string;
  size?: string;
  uploadDate: Date;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isMe: boolean;
}

export default function ProfessionalSessionCallScreen() {
  const router = useRouter();
  const { 
    sessionId,
    bookingId,
    attachments,
    streamCallId,
    streamToken,
    streamApiKey,
    professionalId,
    professionalName,
    endTime
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
  const [warningText, setWarningText] = useState<string>(''); // Add this new state
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [professionalDisconnected, setProfessionalDisconnected] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  
  // Static PDF files for now - you can replace this with actual DB field
  const [pdfFiles] = useState<PDFFile[]>(JSON.parse(attachments as string) as PDFFile[]);
  
  const isInitializing = useRef(false);
  const callDurationTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionEndTimer = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Use Expo's KeepAwake hook to prevent the screen from sleeping
  useKeepAwake();

  // Initialize call
  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    const initializeCall = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus('Joining professional session...');

        // Check if we have all required params to avoid API call
        if (streamCallId && streamToken && streamApiKey) {
          // Use params directly - no need for API call
          setConnectionStatus('Initializing video service...');
          
          const client = await streamService.ensureInitializedWithToken(
            user?.id || '',
            user?.name || '',
            user?.profileImage || '',
            streamToken as string,
            streamApiKey as string
          );

          setConnectionStatus('Connecting to session...');
          const call = await streamService.joinCall(streamCallId as string);

          // Set session end time from endTime parameter
          if (endTime) {
            const [hours, minutes] = (endTime as string).split(':').map(Number);
            const sessionEnd = moment().startOf('day').add(hours, 'hours').add(minutes, 'minutes');
            
            // If the end time is before current time, it's for the next day
            if (sessionEnd.isBefore(moment())) {
              sessionEnd.add(1, 'day');
            }
            
            setSessionEndTime(sessionEnd);
          }

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
        } else {
          // Fallback to API call if params are missing
          const joinResponse = await joinProfessionalSessionCall(bookingId as string);
          
          setConnectionStatus('Getting authentication token...');
          const client = await streamService.ensureInitialized(
            user?.id || '',
            user?.name,
            user?.profileImage
          );

          setConnectionStatus('Connecting to session...');
          const call = await streamService.joinCall(joinResponse.streamCallId);

          // Set session end time from endTime parameter
          if (endTime) {
            const [hours, minutes] = (endTime as string).split(':').map(Number);
            const sessionEnd = moment().startOf('day').add(hours, 'hours').add(minutes, 'minutes');
            
            // If the end time is before current time, it's for the next day
            if (sessionEnd.isBefore(moment())) {
              sessionEnd.add(1, 'day');
            }
            
            setSessionEndTime(sessionEnd);
          }

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
        }
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
  }, [bookingId, streamCallId, streamToken, streamApiKey, user?.id, endTime]);

  // Set up GetStream event listeners
  const setupCallEventListeners = (call: Call) => {
    call.on('call.ended', (event: any) => {
      console.log('Professional session call ended:', event);
      handleCallEnd(event.user ? event.user.name || event.user.id : 'system');
    });

    call.on('call.session_participant_left', (event: any) => {
      console.log('Professional left session:', event);
      // ✅ Check if event.user exists before accessing id
      if (event.user && event.user.id !== user?.id) {
        setProfessionalDisconnected(true);
        Alert.alert(
          'Professional Disconnected',
          'Your professional has disconnected. They may reconnect shortly.',
          [{ text: 'OK' }]
        );
      }
    });

    call.on('call.session_participant_joined', async (event: any) => {
      console.log('Professional rejoined session:', event);
      // ✅ Check if event.user exists before accessing id
      if (event.user && event.user.id !== user?.id) {
        setProfessionalDisconnected(false);
        Alert.alert(
          'Professional Reconnected',
          'Your professional has reconnected to the session.',
          [{ text: 'OK' }]
        );
      }

      // ✅ REMOVED: No recording/transcription logic in student app
      // Professional app handles all recording/transcription
    });

    // Recording event listeners - just listen for events
    call.on('call.recording_started', () => {
      console.log('Recording started');
      setIsRecording(true);
    });

    call.on('call.recording_stopped', () => {
      console.log('Recording stopped');
      setIsRecording(false);
    });

    // Listen for chat messages
    call.on('custom', (event: any) => {
      const { custom } = event;
      console.log('Received custom event:', custom);
      
      if (custom.type === 'session_chat_message') {
        const newMessage: ChatMessage = {
          id: custom.messageId || Date.now().toString(),
          text: custom.message,
          senderId: custom.senderId,
          senderName: custom.senderName,
          timestamp: new Date(custom.timestamp),
          isMe: custom.senderId === user?.id,
        };
        setChatMessages(prev => [...prev, newMessage]);
      }
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

  // Add this helper function to generate dynamic warning text
  const getWarningText = (remaining: number) => {
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes >= 5) {
      return `Session ends in ${minutes} minutes`;
    } else if (minutes >= 1) {
      return `Session ends in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (seconds >= 30) {
      return 'Session ends in 30 seconds';
    } else if (seconds >= 10) {
      return `Session ends in ${seconds} seconds`;
    } else if (seconds >= 5) {
      return `Session ends in ${seconds} seconds`;
    } else {
      return 'Session ending now';
    }
  };

  // Timer for call duration and session end
  useEffect(() => {
    if (!isLoading && callState.call && sessionEndTime) {
      callDurationTimer.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      sessionEndTimer.current = setInterval(() => {
        // Use more precise time calculation
        const now = moment().utc();
        const endTimeUtc = sessionEndTime.utc();
        const remaining = endTimeUtc.diff(now);
        
        if (remaining <= 0) {
          setTimeRemaining('0 min 0 sec');
          setShowEndWarning(false);
          endSessionCall('session_time_up');
        } else {
          const duration = moment.duration(remaining);
          const minutes = Math.floor(duration.asMinutes());
          const seconds = duration.seconds();
          setTimeRemaining(`${minutes} min ${seconds} sec`);
          
          // Show warning at 5 minutes and update text dynamically
          if (remaining <= 5 * 60 * 1000) {
            setShowEndWarning(true);
            setWarningText(getWarningText(remaining));
          } else {
            setShowEndWarning(false);
          }
        }
      }, 1000);

      return () => {
        if (callDurationTimer.current) clearInterval(callDurationTimer.current);
        if (sessionEndTimer.current) clearInterval(sessionEndTimer.current);
      };
    }
  }, [isLoading, callState.call, sessionEndTime]);

  // Use effect for pulse animation
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording, pulseAnim]);

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
      pathname: '(protected)/session-review/[bookingId]' as any,
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
      await endProfessionalSessionCall(bookingId as string);
      
      // Navigate to review screen
      navigateToReviewScreen();
    } catch (error) {
      console.error('Error ending session call:', error);
      // Navigate to review screen anyway
      navigateToReviewScreen();
    }
  };

  const sendChatMessage = async (message: string) => {
    try {
      const call = streamService.getCall();
      if (call && user) {
       await call.sendCustomEvent({
        type: 'session_chat_message',
        messageId: Date.now().toString(),
        message,
        senderId: user.id,
        senderName: user.name || 'Student',
        timestamp: new Date().toISOString(),
       });
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  }

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

  const CustomCallControls = () => {
    const { useCallCallingState, useCameraState, useMicrophoneState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const { camera, isMute: isCameraMute } = useCameraState();
    const { microphone, status: micStatus } = useMicrophoneState();

    return (
      <>
        {/* Collapsible Toggle Button - Always visible in bottom right */}
        <TouchableOpacity 
          style={[
            styles.toggleButton,
            { bottom: controlsVisible ? 280 : 40 } // Dynamic positioning
          ]}
          onPress={() => setControlsVisible(!controlsVisible)}
        >
          <Ionicons 
            name={controlsVisible ? 'chevron-down' : 'chevron-up'} 
            size={20} 
            color={Colors.light.background} 
          />
        </TouchableOpacity>

        {/* Collapsible Controls */}
        {controlsVisible && (
          <View style={styles.callControls}>
            <View style={styles.callInfoContainer}>
              {/* <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text> */}
              <Text style={styles.timeRemaining}>Remaining: {timeRemaining}</Text>
              <Text style={styles.professionalName}>with {professionalName}</Text>
              <View style={styles.recordingIndicatorContainer}>
                <RecordingIndicator />
              </View>
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
                style={[styles.controlButton, { backgroundColor: Colors.light.surface }]}
                onPress={() => camera.flip()}
              >
                <Ionicons 
                  name="camera-reverse" 
                  size={24} 
                  color={Colors.light.text} 
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
                style={[styles.controlButton, { backgroundColor: showPDFModal ? Colors.light.primary : Colors.light.surface }]}
                onPress={() => setShowPDFModal(true)}
              >
                <Ionicons 
                  name="document" 
                  size={24} 
                  color={showPDFModal ? Colors.light.background : Colors.light.text} 
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
                <Text style={styles.warningText}>{warningText}</Text>
              </View>
            )}
          </View>
        )}
      </>
    );
  };

  // Simple animated recording indicator component
  const RecordingIndicator = () => {
    if (!isRecording) return null;

    return (
      <View style={styles.recordingIndicator}>
        <Animated.View 
          style={[
            styles.recordingDot, 
            { transform: [{ scale: pulseAnim }] }
          ]} 
        />
        <ThemedText style={styles.recordingText}>Recording</ThemedText>
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
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
    <>
    <Stack.Screen
        options={{
          headerShown: true,
          title: 'Professional Session',
        }}
      />
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
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
        
        <PDFModal
          visible={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          pdfFiles={pdfFiles as unknown as PDFFile[]}
        />
        <SessionChat
          visible={showChat}
          onClose={() => setShowChat(false)}
          messages={chatMessages}
          onSendMessage={sendChatMessage}
          currentUserId={user?.id || ''}
          currentUserName={user?.name || 'Student'}
        />
        {/* Add recording indicator */}
       
      </ThemedView>
    </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background
  },
  recordingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1000,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginRight: 6,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  },
  toggleButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }
}); 
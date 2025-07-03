import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
// Removed moment - using native Date APIs

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import professionalSessionService, { LobbyDetails } from '@/api/services/professionalSessionService';

export default function SessionLobbyScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lobbyDetails, setLobbyDetails] = useState<LobbyDetails | null>(null);
  const [timeUntilSession, setTimeUntilSession] = useState<string>('');
  const [canJoinSession, setCanJoinSession] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [partnerInLobby, setPartnerInLobby] = useState(false);

  // Simple heartbeat animation (like match-making)
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedLobby = useRef(false);

  // Load lobby details
  useEffect(() => {
    loadLobbyDetails();
  }, [bookingId]);

  // Simple heartbeat animation loop
  useEffect(() => {
    const startHeartbeat = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartbeatAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(heartbeatAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startHeartbeat();
  }, [heartbeatAnim]);

  // SIMPLIFIED: Socket listeners for lobby events
  useEffect(() => {
    if (!socket || !isConnected || !bookingId) return;

    const handleSessionReminder = (data: any) => {
      if (data.bookingId === bookingId) {
        console.log('📢 Session reminder received');
      }
    };

    const handleLobbyAvailable = (data: any) => {
      if (data.bookingId === bookingId) {
        console.log('🚪 Lobby available');
        setCanJoinSession(true);
        loadLobbyDetails(); // Refresh details
      }
    };

    const handleSessionCallCreated = (data: any) => {
      if (data.bookingId === bookingId) {
        console.log('🎬 Session call created, navigating to video call');
        navigateToSessionCall();
      }
    };

    const handleParticipantJoinedLobby = (data: any) => {
      console.log('👋 Participant joined lobby:', data);
      if (data.userRole === 'professional') {
        setPartnerInLobby(true);
      }
    };

    const handleParticipantLeftLobby = (data: any) => {
      console.log('👋 Participant left lobby:', data);
      if (data.userRole === 'professional') {
        setPartnerInLobby(false);
      }
    };

    // Register SIMPLIFIED socket listeners
    socket.on('session_reminder', handleSessionReminder);
    socket.on('lobby_available', handleLobbyAvailable);
    socket.on('session_call_created', handleSessionCallCreated);
    socket.on('participant_joined_lobby', handleParticipantJoinedLobby);
    socket.on('participant_left_lobby', handleParticipantLeftLobby);

    // Join lobby socket room (simplified)
    if (!hasJoinedLobby.current && canJoinSession) {
      socket.emit('join_lobby', {
        bookingId: bookingId,
        userId: user?.id,
        userRole: 'student'
      });
      hasJoinedLobby.current = true;
    }

    return () => {
      socket.off('session_reminder', handleSessionReminder);
      socket.off('lobby_available', handleLobbyAvailable);
      socket.off('session_call_created', handleSessionCallCreated);
      socket.off('participant_joined_lobby', handleParticipantJoinedLobby);
      socket.off('participant_left_lobby', handleParticipantLeftLobby);

      // Leave lobby socket room
      if (hasJoinedLobby.current) {
        socket.emit('leave_lobby', {
          bookingId: bookingId,
          userId: user?.id,
          userRole: 'student'
        });
      }
    };
  }, [socket, isConnected, bookingId, user?.id, canJoinSession]);

  // Simple timer for countdown - using native Date APIs
  useEffect(() => {
    if (!lobbyDetails) return;

    const updateTimer = () => {
      const now = new Date();
      const sessionDateTime = new Date(`${lobbyDetails.scheduledDate}T${lobbyDetails.scheduledTime}`);
      
      const diff = sessionDateTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeUntilSession('Session time has arrived!');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          setTimeUntilSession(`${hours}h ${minutes}m until session`);
        } else if (minutes > 0) {
          setTimeUntilSession(`${minutes}m until session`);
        } else {
          setTimeUntilSession('Starting soon...');
        }
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lobbyDetails]);

  const loadLobbyDetails = async () => {
    try {
      setLoading(true);
      const details = await professionalSessionService.getLobbyDetails(bookingId as string);
      setLobbyDetails(details);
      
      // Check if lobby is available
      setCanJoinSession(details.canJoinSession);
    } catch (error: any) {
      console.error('Error loading lobby details:', error);
      setError(error.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!lobbyDetails || isJoining) return;

    try {
      setIsJoining(true);
      await navigateToSessionCall();
    } catch (error: any) {
      console.error('Error joining session:', error);
      Alert.alert('Error', error.message || 'Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  const navigateToSessionCall = async () => {
    try {
      const joinResponse = await professionalSessionService.joinSessionCall(bookingId as string);
      
      // Navigate to professional session video call
      router.push({
        pathname: '/professional-session-call',
        params: {
          sessionId: joinResponse.sessionId,
          bookingId: joinResponse.bookingId,
          streamCallId: joinResponse.streamCallId,
          professionalId: lobbyDetails?.participant.role === 'professional' ? 'professional' : '',
          professionalName: lobbyDetails?.participant.name || '',
          durationInMinutes: lobbyDetails?.duration?.toString() || '60',
          sessionType: 'professional_session'
        }
      });
    } catch (error: any) {
      console.error('Error navigating to session call:', error);
      throw error;
    }
  };

  const handleGoBack = () => {
    Alert.alert(
      'Leave Lobby',
      'Are you sure you want to leave the lobby?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading session details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.light.error} />
          <ThemedText style={styles.errorTitle}>Unable to Load Session</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadLobbyDetails}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (!canJoinSession && lobbyDetails?.sessionState === 'scheduled') {
    return (
      <ThemedView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.waitingContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          <View style={styles.sessionInfoContainer}>
            <ThemedText style={styles.sessionTitle}>Session with {lobbyDetails.participant.name}</ThemedText>
            <ThemedText style={styles.sessionTime}>
              {new Date(lobbyDetails.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {lobbyDetails.scheduledTime}
            </ThemedText>
            <ThemedText style={styles.countdown}>{timeUntilSession}</ThemedText>
            
            {lobbyDetails.timeToLobby && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={Colors.light.info} />
                <ThemedText style={styles.infoText}>{lobbyDetails.timeToLobby}</ThemedText>
              </View>
            )}
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Session Lobby</ThemedText>
      </View>

      {/* SIMPLE Lobby Content - Like Match Making */}
      <View style={styles.lobbyContent}>
        {/* Heartbeat Animation */}
        <Animated.View style={[styles.heartbeatContainer, { transform: [{ scale: heartbeatAnim }] }]}>
          <View style={styles.heartbeatCircle}>
            <Ionicons name="videocam" size={48} color={Colors.light.primary} />
          </View>
        </Animated.View>

        {/* Simple Messages */}
        <ThemedText style={styles.lobbyTitle}>Session Lobby</ThemedText>
        <ThemedText style={styles.lobbySubtitle}>
          Please wait here in lobby until session starts
        </ThemedText>

        {/* Session Info */}
        <View style={styles.sessionCard}>
          <View style={styles.professionalInfo}>
            {lobbyDetails?.participant.profileImage ? (
              <Image
                source={{ uri: lobbyDetails.participant.profileImage }}
                style={styles.professionalImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <ThemedText style={styles.avatarText}>
                  {lobbyDetails?.participant.name.charAt(0)}
                </ThemedText>
              </View>
            )}
            <View>
              <ThemedText style={styles.professionalName}>{lobbyDetails?.participant.name}</ThemedText>
              <ThemedText style={styles.sessionTopic}>{lobbyDetails?.topic || 'General Session'}</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.sessionTime}>
            {new Date(lobbyDetails?.scheduledDate || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {lobbyDetails?.scheduledTime}
          </ThemedText>
        </View>

        {/* Partner Status */}
        {partnerInLobby && (
          <View style={styles.partnerStatus}>
            <View style={styles.onlineIndicator} />
            <ThemedText style={styles.partnerText}>Professional is in lobby</ThemedText>
          </View>
        )}

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, !canJoinSession && styles.joinButtonDisabled]}
          onPress={handleJoinSession}
          disabled={!canJoinSession || isJoining}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color={Colors.light.background} />
          ) : (
            <>
              <Ionicons name="videocam" size={24} color={Colors.light.background} />
              <ThemedText style={styles.joinButtonText}>
                {lobbyDetails?.sessionState === 'in_progress' ? 'Rejoin Session' : 'Join Session'}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: Colors.light.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
  waitingContainer: {
    flex: 1,
    padding: 20,
  },
  sessionInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.light.text,
  },
  sessionTime: {
    fontSize: 18,
    color: Colors.light.primary,
    marginBottom: 16,
  },
  countdown: {
    fontSize: 16,
    color: Colors.light.secondary,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.text,
  },
  lobbyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heartbeatContainer: {
    marginBottom: 32,
  },
  heartbeatCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  lobbyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.light.text,
  },
  lobbySubtitle: {
    fontSize: 16,
    color: Colors.light.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  sessionCard: {
    width: '100%',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  professionalImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.light.background,
    fontSize: 20,
    fontWeight: '600',
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  sessionTopic: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  partnerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.success,
    marginRight: 8,
  },
  partnerText: {
    fontSize: 14,
    color: Colors.light.success,
  },
  joinButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 'auto',
    minWidth: 200,
  },
  joinButtonDisabled: {
    backgroundColor: Colors.light.inactive,
    opacity: 0.6,
  },
  joinButtonText: {
    color: Colors.light.background,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 
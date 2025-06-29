import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import professionalSessionService, { WaitingRoomDetails } from '@/api/services/professionalSessionService';

export default function SessionWaitingRoomScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waitingRoomDetails, setWaitingRoomDetails] = useState<WaitingRoomDetails | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [canJoinSession, setCanJoinSession] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [partnerInWaitingRoom, setPartnerInWaitingRoom] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedWaitingRoom = useRef(false);

  // Load waiting room details
  useEffect(() => {
    loadWaitingRoomDetails();
  }, [bookingId]);

  // Set up socket listeners for session events
  useEffect(() => {
    if (!socket || !isConnected || !bookingId) return;

    const handleSessionStartingSoon = (data: any) => {
      if (data.bookingId === bookingId) {
        console.log('Session starting soon notification received');
      }
    };

    const handleWaitingRoomAvailable = (data: any) => {
      if (data.bookingId === bookingId) {
        console.log('Waiting room available');
        setCanJoinSession(true);
        loadWaitingRoomDetails(); // Refresh details
      }
    };

    const handleAutoJoinTriggered = (data: any) => {
      if (data.bookingId === bookingId && data.action === 'auto_join_session') {
        console.log('Auto-join triggered, navigating to session call');
        navigateToSessionCall();
      }
    };

    const handleSessionEndingSoon = (data: any) => {
      if (data.bookingId === bookingId) {
        Alert.alert(
          'Session Ending Soon',
          `Your session will end in ${data.minutesLeft} minutes`,
          [{ text: 'OK' }]
        );
      }
    };

    const handleParticipantJoinedWaitingRoom = (data: any) => {
      console.log('Participant joined waiting room:', data);
      if (data.userRole === 'professional') {
        setPartnerInWaitingRoom(true);
      }
    };

    const handleParticipantLeftWaitingRoom = (data: any) => {
      console.log('Participant left waiting room:', data);
      if (data.userRole === 'professional') {
        setPartnerInWaitingRoom(false);
      }
    };

    // Register socket listeners
    socket.on('session_starting_soon', handleSessionStartingSoon);
    socket.on('session_waiting_room_available', handleWaitingRoomAvailable);
    socket.on('session_auto_join_triggered', handleAutoJoinTriggered);
    socket.on('session_ending_soon', handleSessionEndingSoon);
    socket.on('participant_joined_waiting_room', handleParticipantJoinedWaitingRoom);
    socket.on('participant_left_waiting_room', handleParticipantLeftWaitingRoom);

    // Join waiting room socket room
    if (!hasJoinedWaitingRoom.current) {
      socket.emit('join_session_waiting_room', {
        bookingId: bookingId,
        userId: user?.id,
        userRole: 'student'
      });
      hasJoinedWaitingRoom.current = true;
    }

    return () => {
      socket.off('session_starting_soon', handleSessionStartingSoon);
      socket.off('session_waiting_room_available', handleWaitingRoomAvailable);
      socket.off('session_auto_join_triggered', handleAutoJoinTriggered);
      socket.off('session_ending_soon', handleSessionEndingSoon);
      socket.off('participant_joined_waiting_room', handleParticipantJoinedWaitingRoom);
      socket.off('participant_left_waiting_room', handleParticipantLeftWaitingRoom);

      // Leave waiting room socket room
      if (hasJoinedWaitingRoom.current) {
        socket.emit('leave_session_waiting_room', {
          bookingId: bookingId,
          userId: user?.id,
          userRole: 'student'
        });
      }
    };
  }, [socket, isConnected, bookingId, user?.id]);

  // Timer for countdown and session state
  useEffect(() => {
    if (!waitingRoomDetails) return;

    const updateTimer = () => {
      const now = moment();
      const sessionDate = moment(waitingRoomDetails.scheduledDate);
      const sessionTime = moment(`${sessionDate.format('YYYY-MM-DD')} ${waitingRoomDetails.scheduledTime}`);
      
      const diff = sessionTime.diff(now);
      
      if (diff <= 0) {
        setTimeLeft('Session time has arrived!');
        setCanJoinSession(true);
      } else {
        const duration = moment.duration(diff);
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }

        // Enable join button 5 minutes before
        if (diff <= 5 * 60 * 1000) {
          setCanJoinSession(true);
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
  }, [waitingRoomDetails]);

  const loadWaitingRoomDetails = async () => {
    try {
      setLoading(true);
      const details = await professionalSessionService.getWaitingRoomDetails(bookingId as string);
      setWaitingRoomDetails(details);
      
      // Check if waiting room is already available
      if (details.sessionState === 'waiting_room_available' || details.sessionState === 'in_progress') {
        setCanJoinSession(true);
      }
    } catch (error: any) {
      console.error('Error loading waiting room details:', error);
      setError(error.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!waitingRoomDetails || isJoining) return;

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
    router.push({
      pathname: '/professional-session-call/[bookingId]',
      params: { bookingId: bookingId as string }
    });
  };

  const handleGoBack = () => {
    Alert.alert(
      'Leave Waiting Room',
      'Are you sure you want to leave the waiting room? You might miss your session.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: 5 }, (_, index) => (
          <Ionicons
            key={index}
            name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half' : 'star-outline'}
            size={16}
            color="#FFC107"
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Loading session details...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !waitingRoomDetails) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
        <ThemedText style={styles.errorTitle}>Unable to Load Session</ThemedText>
        <ThemedText style={styles.errorText}>
          {error || 'Session details not found'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadWaitingRoomDetails}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Session Waiting Room</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Session Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="time" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.statusTitle}>Session Status</ThemedText>
            </View>
            <ThemedText style={styles.timeLeft}>{timeLeft}</ThemedText>
            <ThemedText style={styles.sessionTime}>
              {moment(waitingRoomDetails.scheduledDate).format('MMMM DD, YYYY')} at {waitingRoomDetails.scheduledTime}
            </ThemedText>
            <View style={styles.sessionStateContainer}>
              <View style={[
                styles.sessionStateIndicator,
                { backgroundColor: canJoinSession ? '#4CAF50' : '#FF9800' }
              ]} />
              <ThemedText style={styles.sessionStateText}>
                {canJoinSession ? 'Ready to Join' : 'Waiting for Session Time'}
              </ThemedText>
            </View>
          </View>

          {/* Professional Info */}
          <View style={styles.professionalCard}>
            <ThemedText style={styles.sectionTitle}>Your Professional</ThemedText>
            <View style={styles.professionalInfo}>
              <View style={styles.professionalAvatar}>
                {waitingRoomDetails.participant.profileImage ? (
                  <Image
                    source={{ uri: waitingRoomDetails.participant.profileImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={32} color="#666" />
                )}
              </View>
              <View style={styles.professionalDetails}>
                <ThemedText style={styles.professionalName}>
                  {waitingRoomDetails.participant.name}
                </ThemedText>
                <View style={styles.ratingContainer}>
                  {renderStars(waitingRoomDetails.participant.averageRating)}
                  <ThemedText style={styles.ratingText}>
                    ({waitingRoomDetails.participant.averageRating.toFixed(1)})
                  </ThemedText>
                </View>
                <View style={styles.specializationsContainer}>
                  {waitingRoomDetails.participant.specializations.slice(0, 2).map((spec, index) => (
                    <View key={index} style={styles.specializationTag}>
                      <ThemedText style={styles.specializationText}>{spec}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.onlineStatusContainer}>
                <View style={[
                  styles.onlineIndicator,
                  { backgroundColor: partnerInWaitingRoom ? '#4CAF50' : '#666' }
                ]} />
                <ThemedText style={styles.onlineStatusText}>
                  {partnerInWaitingRoom ? 'In Waiting Room' : 'Not Yet Joined'}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Session Details */}
          <View style={styles.sessionCard}>
            <ThemedText style={styles.sectionTitle}>Session Details</ThemedText>
            <View style={styles.sessionDetail}>
              <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
              <ThemedText style={styles.sessionDetailText}>
                Duration: {waitingRoomDetails.duration} minutes
              </ThemedText>
            </View>
            {waitingRoomDetails.topic && (
              <View style={styles.sessionDetail}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.light.primary} />
                <ThemedText style={styles.sessionDetailText}>
                  Topic: {waitingRoomDetails.topic}
                </ThemedText>
              </View>
            )}
            {waitingRoomDetails.studentNotes && (
              <View style={styles.sessionDetail}>
                <Ionicons name="document-text-outline" size={20} color={Colors.light.primary} />
                <ThemedText style={styles.sessionDetailText}>
                  Your Notes: {waitingRoomDetails.studentNotes}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Session Guidelines */}
          <View style={styles.guidelinesCard}>
            <ThemedText style={styles.sectionTitle}>Session Guidelines</ThemedText>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <ThemedText style={styles.guidelineText}>
                Ensure you have a stable internet connection
              </ThemedText>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <ThemedText style={styles.guidelineText}>
                Find a quiet place for the session
              </ThemedText>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <ThemedText style={styles.guidelineText}>
                Test your microphone and camera
              </ThemedText>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <ThemedText style={styles.guidelineText}>
                Session will be recorded for your learning
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        {/* Join Session Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.joinButton,
              {
                backgroundColor: canJoinSession && !isJoining 
                  ? Colors.light.primary 
                  : '#ccc'
              }
            ]}
            onPress={handleJoinSession}
            disabled={!canJoinSession || isJoining}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="videocam" size={24} color="#fff" />
                <ThemedText style={styles.joinButtonText}>
                  {canJoinSession ? 'Join Session' : `Available in ${timeLeft}`}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeLeft: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  sessionTime: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  sessionStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStateIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sessionStateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  professionalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  professionalDetails: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  specializationText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  onlineStatusContainer: {
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  onlineStatusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDetailText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  guidelinesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelineText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    color: '#666',
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 
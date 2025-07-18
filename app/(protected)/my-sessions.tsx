import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { BookingCard } from '@/components/shared/BookingCard';
import { Booking, cancelBooking } from '@/api/services/public/professionalService';
import { get } from '@/api/config/axiosConfig';
import { TransformedBooking } from '@/types';
import { joinProfessionalSessionCall } from '@/api/services/callService';

const { width, height } = Dimensions.get('window');

// Session Lobby Component (inline for student app)
interface SessionLobbyProps {
  visible: boolean;
  booking: TransformedBooking | null;
  onClose: () => void;
  onSessionStart: () => void;
}

const SessionLobby: React.FC<SessionLobbyProps> = ({
  visible,
  booking,
  onClose,
  onSessionStart,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isSessionTime, setIsSessionTime] = useState(false);
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Heartbeat animation
  useEffect(() => {
    const createHeartbeat = () => {
      return Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.1,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ]);
    };

    const heartbeatLoop = () => {
      createHeartbeat().start(() => {
        if (visible) {
          heartbeatLoop();
        }
      });
    };

    if (visible) {
      heartbeatLoop();
    }

    return () => {
      heartbeatAnim.setValue(1);
    };
  }, [visible, heartbeatAnim]);

  // Pulse animation
  useEffect(() => {
    const createPulse = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    if (visible) {
      createPulse().start();
    }

    return () => {
      pulseAnim.setValue(0.8);
    };
  }, [visible, pulseAnim]);

  // Time checking logic
  useEffect(() => {
    if (!visible || !booking) return;

    const checkTime = () => {
      // Use more precise time calculation with UTC
      const now = new Date();
      
      // Parse the session start time more precisely
      let sessionStart;
      if (booking.scheduledDate.includes('T')) {
        // ISO format: "2025-07-05T00:00:00.000+00:00"
        const dateOnly = booking.scheduledDate.split('T')[0];
        sessionStart = new Date(`${dateOnly}T${booking.scheduledTime}:00`);
      } else {
        // Date only format: "2025-07-05"
        sessionStart = new Date(`${booking.scheduledDate}T${booking.scheduledTime}:00`);
      }
      
      if (now >= sessionStart) {
        setIsSessionTime(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Auto-start session after a brief delay
        setTimeout(() => {
          onSessionStart();
        }, 1000);
        return;
      }

      // Use millisecond precision for better synchronization
      const timeDiff = sessionStart.getTime() - now.getTime();
      const totalSeconds = Math.floor(timeDiff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    checkTime();
    intervalRef.current = setInterval(checkTime, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [visible, booking, onSessionStart]);

  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!visible || !booking) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={lobbyStyles.overlay}>
        <View style={lobbyStyles.container}>
          <TouchableOpacity style={lobbyStyles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <View style={lobbyStyles.content}>
            <Animated.View
              style={[
                lobbyStyles.heartContainer,
                { transform: [{ scale: heartbeatAnim }] },
              ]}
            >
              <Ionicons name="heart" size={60} color={Colors.light.primary} />
            </Animated.View>

            <Animated.View
              style={[
                lobbyStyles.usersContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={lobbyStyles.usersRow}>
                <View style={[lobbyStyles.userAvatar, lobbyStyles.student]}>
                  <Ionicons name="person" size={24} color="#FFF" />
                </View>
                <View style={lobbyStyles.waitingDots}>
                  <View style={[lobbyStyles.dot, lobbyStyles.dot1]} />
                  <View style={[lobbyStyles.dot, lobbyStyles.dot2]} />
                  <View style={[lobbyStyles.dot, lobbyStyles.dot3]} />
                </View>
                <View style={[lobbyStyles.userAvatar, lobbyStyles.professional]}>
                  <Ionicons name="person" size={24} color="#FFF" />
                </View>
              </View>
            </Animated.View>

            <View style={lobbyStyles.sessionInfo}>
              <Text style={lobbyStyles.sessionTitle}>
                Session with {booking.professional.name}
              </Text>
              <Text style={lobbyStyles.sessionTopic}>
                {booking.topic}
              </Text>
              <Text style={lobbyStyles.sessionTime}>
                Scheduled: {formatTime(booking.scheduledTime)}
              </Text>
            </View>

            <View style={lobbyStyles.statusContainer}>
              {isSessionTime ? (
                <>
                  <ActivityIndicator size="large" color={Colors.light.primary} />
                  <Text style={lobbyStyles.startingText}>
                    Starting session...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={lobbyStyles.waitingText}>
                    Please wait here in lobby until session starts
                  </Text>
                  <Text style={lobbyStyles.countdownText}>
                    Session starts in: {timeRemaining}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function MySessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [bookings, setBookings] = useState<TransformedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [joiningSession, setJoiningSession] = useState<string | null>(null);

  // Lobby states
  const [showLobby, setShowLobby] = useState(false);
  const [lobbyBooking, setLobbyBooking] = useState<TransformedBooking | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading bookings...');
      const response = await get('/api/v1/bookings/my-bookings');
      console.log('📡 API Response:', response.data);
      
      if (response.data.variant === 'success') {
        const bookingsData = response.data.myData.bookings || [];
        console.log('📅 Bookings data:', bookingsData);
        console.log('📊 Total bookings:', bookingsData.length);
        setBookings(bookingsData);
      } else {
        throw new Error(response.data.message || 'Failed to load bookings');
      }
    } catch (err: any) {
      console.error('❌ Error loading bookings:', err);
      console.error('❌ Error details:', err.response?.data);
      setError(err.message || 'Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [loadBookings]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Set up socket listeners for real-time session updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleSessionReminder = (data: any) => {
      console.log('📢 Session reminder:', data);
      loadBookings();
    };

    const handleLobbyAvailable = (data: any) => {
      console.log('🚪 Lobby available:', data);
      loadBookings();
    };

    const handleSessionStateChanged = (data: any) => {
      console.log('🔄 Session state changed:', data);
      setBookings(prev => prev.map(booking => 
        booking._id === data.bookingId 
          ? { ...booking, sessionState: data.sessionState, status: data.status }
          : booking
      ));
    };

    socket.on('session_reminder', handleSessionReminder);
    socket.on('lobby_available', handleLobbyAvailable);
    socket.on('session_state_changed', handleSessionStateChanged);

    return () => {
      socket.off('session_reminder', handleSessionReminder);
      socket.off('lobby_available', handleLobbyAvailable);
      socket.off('session_state_changed', handleSessionStateChanged);
    };
  }, [socket, isConnected, loadBookings]);

  const getFilteredBookings = () => {
    const now = new Date();
    console.log('🔍 Filtering bookings. Total bookings:', bookings.length);
    console.log('📋 All bookings:', bookings);
    console.log('🏷️ Active tab:', activeTab);
    
    if (activeTab === 'upcoming') {
      const upcomingBookings = bookings.filter(booking => {
        const sessionDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        
        console.log(`📅 Booking ${booking._id}:`, {
          status: booking.status,
          sessionDateTime: sessionDateTime.toISOString(),
          twoHoursAgo: twoHoursAgo.toISOString(),
          isAfterTwoHoursAgo: sessionDateTime > twoHoursAgo,
          statusMatches: ['booked', 'confirmed', 'lobby_active', 'in_progress'].includes(booking.status)
        });
        
        return ['booked', 'confirmed', 'lobby_active', 'in_progress'].includes(booking.status) &&
               sessionDateTime > twoHoursAgo;
      }).sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
        const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log('⏰ Upcoming bookings:', upcomingBookings.length);
      return upcomingBookings;
    } else {
      const completedBookings = bookings.filter(booking => 
        ['completed', 'cancelled_by_student', 'cancelled_by_professional'].includes(booking.status)
      ).sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
        const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ Completed bookings:', completedBookings.length);
      return completedBookings;
    }
  };

  const canJoinLobby = (booking: TransformedBooking) => {
    const sessionDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
    const now = new Date();
    
    const sessionEndTime = new Date(sessionDateTime.getTime() + (booking.duration * 60 * 1000));
    const fiveMinutesBeforeStart = new Date(sessionDateTime.getTime() - (5 * 60 * 1000));
    
    const canJoin = now >= fiveMinutesBeforeStart && now <= sessionEndTime;
    const isValidSession = !['cancelled_by_student', 'cancelled_by_professional', 'completed'].includes(booking.status);
    
    return canJoin && isValidSession;
  };

  const shouldStartSessionImmediately = (booking: TransformedBooking) => {
    const now = new Date();
    const sessionStart = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
    return now >= sessionStart;
  };

  const handleJoinSession = async (booking: TransformedBooking) => {
    if (joiningSession === booking._id) return;
    
    if (!canJoinLobby(booking)) {
      Alert.alert(
        'Session Not Available',
        'You can only join the session 5 minutes before the scheduled time.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if session should start immediately
    if (shouldStartSessionImmediately(booking)) {
      // Start session immediately
      await startSession(booking);
    } else {
      // Show lobby and wait
      setLobbyBooking(booking);
      setShowLobby(true);
    }
  };

  const startSession = async (booking: TransformedBooking) => {
    try {
      setJoiningSession(booking._id);
      console.log('🚀 Attempting to join session:', booking._id);
      
      const joinResponse = await joinProfessionalSessionCall(booking._id);
      console.log('📡 Join response:', joinResponse);
      
      router.push({
        pathname: '/professional-session-call',
        params: {
          sessionId: joinResponse.sessionId || booking.sessionId || 'new',
          bookingId: joinResponse.bookingId || booking._id,
          attachments: JSON.stringify(booking.attachments),
          streamCallId: joinResponse.streamCallId,
          streamToken: joinResponse.streamToken,
          streamApiKey: joinResponse.streamApiKey,
          professionalId: booking.professional._id,
          professionalName: booking.professional.name,
          durationInMinutes: booking.duration.toString(),
          endTime: booking.endTime
        }
      });
    } catch (error: any) {
      console.error('Error joining session:', error);
      Alert.alert('Error', error.message || 'Failed to join session. Please try again.');
    } finally {
      setTimeout(() => setJoiningSession(null), 2000);
    }
  };

  const handleLobbySessionStart = () => {
    if (lobbyBooking) {
      setShowLobby(false);
      startSession(lobbyBooking);
    }
  };

  const handleCloseLobby = () => {
    setShowLobby(false);
    setLobbyBooking(null);
  };

  const handleCancelBooking = async (booking: TransformedBooking) => {
    // Parse the scheduled date and time
    const scheduledDate = new Date(booking.scheduledDate);
    const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
    
    // Create session start time by combining date and time
    const sessionStartTime = new Date(scheduledDate);
    sessionStartTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const timeDiff = sessionStartTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < 10) {
      Alert.alert(
        'Cannot Cancel',
        'Sessions can only be cancelled at least 10 minutes before the scheduled time.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session? Your coins will be refunded.',
      [
        { text: 'Keep Session', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚫 Cancelling booking:', booking._id);
              setProcessing(true);
              await cancelBooking(booking._id, 'Cancelled by student');
              
              // Update the booking status locally
              setBookings(prev => prev.map(b => 
                b._id === booking._id 
                  ? { ...b, status: 'cancelled_by_student' }
                  : b
              ));
              
              Alert.alert('Success', 'Session cancelled successfully. Your coins have been refunded.');
            } catch (error: any) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', error.message || 'Failed to cancel session. Please try again.');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: TransformedBooking }) => {
    // Calculate session info for completed sessions
    const sessionInfo = item.status === 'completed' ? {
      actualStartTime: item.scheduledTime,
      actualEndTime: item.endTime,
      sessionStatus: 'Completed'
    } : undefined;

    // Check if booking can be cancelled (at least 10 minutes before)
    const canCancelBooking = () => {
      try {
        // Handle different date formats
        let sessionStartTime;
        
        if (item.scheduledDate.includes('T')) {
          // ISO format: "2025-07-05T00:00:00.000+00:00"
          const dateOnly = item.scheduledDate.split('T')[0]; // Get "2025-07-05"
          sessionStartTime = new Date(`${dateOnly}T${item.scheduledTime}:00`);
        } else {
          // Date only format: "2025-07-05"
          sessionStartTime = new Date(`${item.scheduledDate}T${item.scheduledTime}:00`);
        }

        const now = new Date();
        
        // Calculate time difference
        const timeDiff = sessionStartTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        // Check conditions
        const isBeforeSession = now < sessionStartTime;
        const hasEnoughTimeToCancel = minutesDiff >= 10; // 10 minutes before session
        const isValidStatus = ['booked', 'confirmed'].includes(item.status);
        
        console.log(`📅 Cancellation check for booking ${item._id}:`, {
          scheduledDate: item.scheduledDate,
          scheduledTime: item.scheduledTime,
          sessionStartTime: sessionStartTime.toISOString(),
          currentTime: now.toISOString(),
          minutesDiff: minutesDiff.toFixed(2),
          isBeforeSession,
          hasEnoughTimeToCancel,
          isValidStatus,
          canCancel: isBeforeSession && hasEnoughTimeToCancel && isValidStatus
        });
        
        return isBeforeSession && hasEnoughTimeToCancel && isValidStatus;
        
      } catch (error) {
        console.error(`❌ Error in canCancelBooking for ${item._id}:`, error);
        return false;
      }
    };

    return (
      <BookingCard
        booking={item}
        sessionInfo={sessionInfo}
        onCancel={() => handleCancelBooking(item)}
        processing={processing}
        onJoin={() => handleJoinSession(item)}
        canCancel={canCancelBooking()}
        canJoin={canJoinLobby(item)}
        isJoining={joiningSession === item._id}
        joinInfo={!canJoinLobby(item) && ['booked', 'confirmed'].includes(item.status) ? 
          "Join Session Option will be appear Only 5 minutes before your scheduled session time" : undefined
        }
      />
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Sessions',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(protected)/professionals')}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="add" size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBookings}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.light.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'upcoming' ? 'calendar-outline' : 'checkmark-circle-outline'} 
                size={64} 
                color={Colors.light.surface} 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming' 
                  ? 'No upcoming sessions' 
                  : 'No completed sessions'}
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  style={styles.bookSessionButton}
                  onPress={() => router.push('/(protected)/professionals')}
                >
                  <Text style={styles.bookSessionButtonText}>Book a Session</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Session Lobby Modal */}
      <SessionLobby
        visible={showLobby}
        booking={lobbyBooking}
        onClose={handleCloseLobby}
        onSessionStart={handleLobbySessionStart}
      />
    </View>
  );
}

// Lobby styles
const lobbyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 10,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  heartContainer: {
    marginBottom: 30,
  },
  usersContainer: {
    marginBottom: 30,
  },
  usersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  professional: {
    backgroundColor: Colors.light.primary,
  },
  student: {
    backgroundColor: '#FF6B6B',
  },
  waitingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.3s',
  },
  dot3: {
    animationDelay: '0.6s',
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  sessionTopic: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  sessionTime: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 16,
  },
  waitingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    textAlign: 'center',
  },
  startingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 10,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
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
  list: {
    padding: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  bookSessionButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookSessionButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
}); 
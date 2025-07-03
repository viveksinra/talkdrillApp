import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// Removed moment - using native Date APIs

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { BookingCard } from '@/components/shared/BookingCard';
import { Booking } from '@/api/services/public/professionalService';
import { get } from '@/api/config/axiosConfig';

interface BookingWithProfessional {
  _id: string;
  student: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  professional: {
    _id: string;
    name: string;
    profileImage?: string;
    specializations: string[];
    averageRating: number;
  };
  scheduledDate: string;
  scheduledTime: string;
  endTime: string;
  duration: number;
  topic?: string;
  studentNotes?: string;
  status: string;
  sessionState?: 'scheduled' | 'lobby_active' | 'in_progress' | 'completed';
  amount: number;
  coinsDeducted: number;
  videoCallDetails?: {
    streamCallId?: string;
    lobbyActivatedAt?: string;
  };
}

export default function MySessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [bookings, setBookings] = useState<BookingWithProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [joiningSession, setJoiningSession] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading bookings...');
      // Fetch user's bookings from backend
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
      loadBookings(); // Refresh bookings when session state changes
    };

    const handleLobbyAvailable = (data: any) => {
      console.log('🚪 Lobby available:', data);
      loadBookings(); // Refresh bookings
    };

    const handleSessionStateChanged = (data: any) => {
      console.log('🔄 Session state changed:', data);
      // Update booking state in real-time
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

  const canJoinLobby = (booking: BookingWithProfessional) => {
    const sessionDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
    const now = new Date();
    
    // Calculate session end time = start time + duration (in minutes)
    const sessionEndTime = new Date(sessionDateTime.getTime() + (booking.duration * 60 * 1000));
    
    // Calculate 5 minutes before session start
    const fiveMinutesBeforeStart = new Date(sessionDateTime.getTime() - (5 * 60 * 1000));
    
    // Show join button if current time is between:
    // 5 minutes before session start AND session end time
    const canJoin = now >= fiveMinutesBeforeStart && now <= sessionEndTime;
    
    // Only show for non-cancelled sessions
    const isValidSession = !['cancelled_by_student', 'cancelled_by_professional', 'completed'].includes(booking.status);
    
    return canJoin && isValidSession;
  };

  const handleJoinSession = async (booking: BookingWithProfessional) => {
    // Prevent multiple clicks
    if (joiningSession === booking._id) return;
    
    try {
      setJoiningSession(booking._id);
      console.log('🚀 Attempting to join session:', booking._id);
      
      // Navigate directly to session call screen
      router.push({
        pathname: '/professional-session-call',
        params: {
          sessionId: booking.sessionId || 'new',
          bookingId: booking._id,
          professionalId: booking.professional._id,
          professionalName: booking.professional.name,
          durationInMinutes: booking.duration.toString()
        }
      });
    } catch (error: any) {
      console.error('Error joining session:', error);
      Alert.alert('Error', error.message || 'Failed to join session. Please try again.');
    } finally {
      // Reset loading state after navigation
      setTimeout(() => setJoiningSession(null), 2000);
    }
  };

  const handleCancelBooking = async (booking: BookingWithProfessional) => {
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
              // Implement cancellation API call
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel session. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: BookingWithProfessional }) => {
    const sessionDateTime = new Date(`${item.scheduledDate}T${item.scheduledTime}`);
    const sessionEndTime = new Date(sessionDateTime.getTime() + (item.duration * 60 * 1000));
    const now = new Date();
    const minutesUntilStart = Math.floor((sessionDateTime.getTime() - now.getTime()) / (1000 * 60));
    const minutesUntilEnd = Math.floor((sessionEndTime.getTime() - now.getTime()) / (1000 * 60));
    const canJoin = canJoinLobby(item);
    const isJoining = joiningSession === item._id;

    return (
      <View style={styles.bookingContainer}>
        {/* Professional Info Header */}
        <View style={styles.professionalHeader}>
          <Image
            source={{
              uri: item.professional.profileImage || 'https://via.placeholder.com/40'
            }}
            style={styles.professionalImage}
          />
          <View style={styles.professionalInfo}>
            <Text style={styles.professionalName}>{item.professional.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={Colors.light.warning} />
              <Text style={styles.rating}>{item.professional.averageRating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Booking Card */}
        <BookingCard
          booking={item as any}
          onPress={() => {
            // Navigate to booking details if needed
          }}
          onCancel={() => handleCancelBooking(item)}
        />

        {/* Session Status & Actions */}
        <View style={styles.actionsContainer}>
          {/* Show different timing info based on session state */}
          {minutesUntilStart > 5 && (
            <View style={styles.infoContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.light.icon} />
              <Text style={styles.infoText}>
                Available to join in {minutesUntilStart - 5} minutes
              </Text>
            </View>
          )}

          {minutesUntilStart <= 5 && minutesUntilStart > 0 && (
            <View style={styles.readyContainer}>
              <Ionicons name="radio-button-on" size={16} color={Colors.light.success} />
              <Text style={styles.readyText}>
                Session starts in {minutesUntilStart} minutes - Ready to join!
              </Text>
            </View>
          )}

          {minutesUntilStart <= 0 && minutesUntilEnd > 0 && (
            <View style={styles.activeContainer}>
              <Ionicons name="videocam" size={16} color={Colors.light.primary} />
              <Text style={styles.activeText}>
                Session is active - {minutesUntilEnd} minutes remaining
              </Text>
            </View>
          )}

          {minutesUntilEnd <= 0 && (
            <View style={styles.expiredContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.light.error} />
              <Text style={styles.expiredText}>
                Session time has ended
              </Text>
            </View>
          )}

          {/* Join button - show only during valid time window */}
          {canJoin && (
            <TouchableOpacity
              style={[
                styles.joinButton,
                isJoining && styles.joinButtonLoading
              ]}
              onPress={() => handleJoinSession(item)}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <ActivityIndicator size="small" color={Colors.light.background} />
                  <Text style={styles.joinButtonText}>Joining...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="videocam" size={20} color={Colors.light.background} />
                  <Text style={styles.joinButtonText}>Join Session</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Debug info for development */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Start: {minutesUntilStart}m | End: {minutesUntilEnd}m | CanJoin: {canJoin ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.debugText}>
                SessionTime: {sessionDateTime.toLocaleTimeString()} | EndTime: {sessionEndTime.toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(protected)/(tabs)/professionals')}
        >
          <Ionicons name="add" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

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
                  onPress={() => router.push('/(protected)/(tabs)/professionals')}
                >
                  <Text style={styles.bookSessionButtonText}>Book a Session</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  addButton: {
    padding: 8,
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
  bookingContainer: {
    marginBottom: 20,
  },
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  professionalImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
  },
  readyText: {
    fontSize: 12,
    color: Colors.light.success,
    fontWeight: '500',
  },
  activeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  activeText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  expiredText: {
    fontSize: 12,
    color: Colors.light.error,
  },
  joinButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    minWidth: 180,
    gap: 8,
  },
  joinButtonLoading: {
    opacity: 0.7,
  },
  joinButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
  waitingInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.info,
    borderRadius: 8,
  },
  waitingInfoText: {
    fontSize: 14,
    color: Colors.light.info,
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
  debugContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
}); 
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
import moment from 'moment';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { BookingCard } from '@/components/shared/BookingCard';
import { Booking } from '@/api/services/public/professionalService';
import { get } from '@/api/config/axiosConfig';
import { TransformedBooking } from '@/types';

export default function MySessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [bookings, setBookings] = useState<TransformedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningSession, setJoiningSession] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user's bookings from backend
      const response = await get('/api/v1/bookings/my-bookings');
      if (response.data.variant === 'success') {
        setBookings(response.data.myData.bookings || []);
      } else {
        throw new Error(response.data.message || 'Failed to load bookings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions. Please try again.');
      console.error('Error loading bookings:', err);
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

    const handleSessionStartingSoon = (data: any) => {
      // Refresh bookings to get updated state
      loadBookings();
    };

    const handleWaitingRoomAvailable = (data: any) => {
      // Refresh bookings to show waiting room availability
      loadBookings();
    };

    const handleSessionStateChanged = (data: any) => {
      // Update booking state in real-time
      setBookings(prev => prev.map(booking => 
        booking._id === data.bookingId 
          ? { ...booking, sessionState: data.sessionState, status: data.status }
          : booking
      ));
    };

    socket.on('session_starting_soon', handleSessionStartingSoon);
    socket.on('session_waiting_room_available', handleWaitingRoomAvailable);
    socket.on('session_state_changed', handleSessionStateChanged);

    return () => {
      socket.off('session_starting_soon', handleSessionStartingSoon);
      socket.off('session_waiting_room_available', handleWaitingRoomAvailable);
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

  const canJoinSession = (booking: TransformedBooking) => {
    const sessionTime = moment(`${booking.scheduledDate} ${booking.scheduledTime}`);
    const now = moment();
    const diffMinutes = sessionTime.diff(now, 'minutes');
    
    return (
      diffMinutes <= 5 && diffMinutes >= -30 // 5 minutes before to 60 minutes after
    );
  };

  const handleJoinSession = async (booking: TransformedBooking) => {
    // Prevent multiple clicks
    if (joiningSession === booking._id) return;
    
    try {
      setJoiningSession(booking._id);
      console.log('🚀 Attempting to join session:', booking._id);
      
      // Navigate directly to session call screen
      router.push({
        pathname: '/(protected)/professional-session-call' as any,
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


  const handleCancelBooking = async (booking: TransformedBooking) => {
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

  
  const renderBookingItem = ({ item }: { item: TransformedBooking }) => {
    const sessionDateTime = new Date(`${item.scheduledDate}T${item.scheduledTime}`);
    const sessionEndTime = new Date(sessionDateTime.getTime() + (item.duration * 60 * 1000));
    const now = new Date();
    const minutesUntilStart = Math.floor((sessionDateTime.getTime() - now.getTime()) / (1000 * 60));
    const minutesUntilEnd = Math.floor((sessionEndTime.getTime() - now.getTime()) / (1000 * 60));
    const canJoin = canJoinSession(item);
    const isJoining = joiningSession === item._id;

    const sessionInfo = item.status === 'completed' ? {
      actualStartTime: item.scheduledTime,
      actualEndTime: item.endTime,
      sessionStatus: 'Completed'
    } : undefined;

    return (
      <View>
        <BookingCard
          booking={item}
          sessionInfo={sessionInfo}
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
          onPress={() => router.push('/(protected)/(tabs)/professionals' as any)}
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

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.secondaryDark} />
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
                  onPress={() => router.push('/(protected)/(tabs)/professionals' as any)}
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.secondaryLight,
  },
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readyText: {
    fontSize: 14,
    color: Colors.light.secondaryLight,
  },
  activeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  joinButtonLoading: {
    opacity: 0.7,
  },
  activeText: {
    fontSize: 14,
    color: Colors.light.secondaryLight,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  expiredText: {
    fontSize: 14,
    color: Colors.light.secondaryDark,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.light.secondary,
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
    color: Colors.light.secondaryLight,
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
    color: Colors.light.secondaryDark,
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
    color: Colors.light.secondaryLight,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.secondaryLight,
    borderRadius: 8,
  },
  reminderText: {
    fontSize: 14,
    color: Colors.light.secondaryLight,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
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
    color: Colors.light.secondaryLight,
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
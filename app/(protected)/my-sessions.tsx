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
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
// Removed moment - using native Date APIs

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { BookingCard } from '@/components/shared/BookingCard';
import { Booking, cancelBooking } from '@/api/services/public/professionalService';
import { get } from '@/api/config/axiosConfig';
import { TransformedBooking } from '@/types';
import { joinProfessionalSessionCall } from '@/api/services/callService';


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

  const canJoinLobby = (booking: TransformedBooking) => {
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

  const handleJoinSession = async (booking: TransformedBooking) => {
    // Prevent multiple clicks
    if (joiningSession === booking._id) return;
    
    try {
      setJoiningSession(booking._id);
      console.log('🚀 Attempting to join session:', booking._id);
      
      // First, join the session via API to get all required data
      const joinResponse = await joinProfessionalSessionCall(booking._id);
      console.log('📡 Join response:', joinResponse);
      
      // Navigate to session call screen with all required parameters
      router.push({
        pathname: '/professional-session-call',
        params: {
          sessionId: joinResponse.sessionId || booking.sessionId || 'new',
          bookingId: joinResponse.bookingId || booking._id,
          streamCallId: joinResponse.streamCallId,
          streamToken: joinResponse.streamToken,
          streamApiKey: joinResponse.streamApiKey,
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
    </View>
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
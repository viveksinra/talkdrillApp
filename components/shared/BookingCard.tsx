import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Booking } from '@/api/services/public/professionalService';
import { TransformedBooking } from '@/types';

interface BookingCardProps {
  booking: TransformedBooking;
  onPress?: () => void;
  onCancel?: () => void;
  style?: any;
  sessionInfo?: any;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  sessionInfo,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
      case 'confirmed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'completed':
        return '#9C27B0';
      case 'cancelled_by_student':
      case 'cancelled_by_professional':
        return '#FF5722';
      default:
        return Colors.light.icon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked':
        return 'Booked';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled_by_student':
        return 'Cancelled';
      case 'cancelled_by_professional':
        return 'Cancelled by Professional';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <View style={styles.card}>
      {/* Professional Info */}
      <View style={styles.professionalSection}>
        <Image
          source={{
            uri: booking.professional.profileImage || 'https://via.placeholder.com/40'
          }}
          style={styles.professionalImage}
        />
        <View style={styles.professionalInfo}>
          <Text style={styles.professionalName}>{booking.professional.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={Colors.light.warning} />
            <Text style={styles.rating}>{booking.professional.averageRating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>
      </View>

      {/* Session Details */}
      <View style={styles.detailsSection}>
        {/* Date & Time */}
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(booking.scheduledDate)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{formatTime(booking.scheduledTime)} - {formatTime(booking.endTime)}</Text>
          </View>
        </View>

        {/* Duration & Topic */}
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{booking.duration} minutes</Text>
          </View>
          {booking.topic && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Topic</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{booking.topic}</Text>
            </View>
          )}
        </View>

        {/* Cost */}
        <View style={styles.costRow}>
          <Ionicons name="wallet-outline" size={16} color={Colors.light.secondary} />
          <Text style={styles.costText}>₹{booking.amount} ({booking.coinsDeducted} coins)</Text>
        </View>
      </View>

      {/* Session Information (for completed sessions) */}
      {booking.status === 'completed' && sessionInfo && (
        <View style={styles.sessionInfoSection}>
          <View style={styles.sessionInfoHeader}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
            <Text style={styles.sessionInfoTitle}>Session Completed</Text>
          </View>
          {sessionInfo.actualStartTime && sessionInfo.actualEndTime && (
            <View style={styles.sessionTimes}>
              <Text style={styles.sessionTimeText}>
                Started: {sessionInfo.actualStartTime} | Ended: {sessionInfo.actualEndTime}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Session Status (for ongoing sessions) */}
      {booking.status === 'in_progress' && (
        <View style={styles.ongoingSection}>
          <View style={styles.ongoingIndicator}>
            <View style={styles.pulsingDot} />
            <Text style={styles.ongoingText}>Session is active</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  professionalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: Colors.light.background,
    fontWeight: '600',
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  costText: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  sessionInfoSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  sessionInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sessionInfoTitle: {
    fontSize: 14,
    color: Colors.light.success,
    fontWeight: '500',
  },
  sessionTimes: {
    marginLeft: 22,
  },
  sessionTimeText: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  ongoingSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  ongoingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  ongoingText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
}); 
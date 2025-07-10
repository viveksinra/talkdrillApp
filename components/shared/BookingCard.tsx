import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  onCancel,
  style,
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
        return Colors.light.secondary;
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

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.date}>{formatDate(booking.scheduledDate)}</Text>
          <Text style={styles.time}>{booking.scheduledTime} - {booking.endTime}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {booking.topic && (
          <View style={styles.topicContainer}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.light.primary} />
            <Text style={styles.topic}>{booking.topic}</Text>
          </View>
        )}
        
        <View style={styles.costContainer}>
          <Ionicons name="wallet-outline" size={16} color={Colors.light.secondary} />
          <Text style={styles.cost}>₹{booking.amount} ({booking.coinsDeducted} coins)</Text>
        </View>

        <View style={styles.durationContainer}>
          <Ionicons name="time-outline" size={16} color={Colors.light.secondary} />
          <Text style={styles.duration}>{booking.duration} minutes</Text>
        </View>
      </View>

      {booking.status === 'booked' || booking.status === 'confirmed' ? (
        <View style={styles.actions}>
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  time: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: Colors.light.background,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  topicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topic: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cost: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.secondary,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.secondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#FF5722',
    fontWeight: '600',
  },
}); 
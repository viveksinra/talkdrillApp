import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Professional } from '@/api/services/public/professionalService';

interface ProfessionalCardProps {
  professional: Professional;
  onPress: () => void;
  style?: any;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  professional,
  onPress,
  style,
}) => {
  const formatExperience = (years: number) => {
    if (years === 0) return 'New';
    if (years === 1) return '1 year';
    return `${years}+ years exp.`;
  };

  const formatSessionCount = (count: number) => {
    if (count === 0) return 'New';
    if (count === 1) return '1 session';
    return `${count} sessions`;
  };

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.professionalName} numberOfLines={1}>
            {professional.name.length > 15 
              ? professional.name.slice(0, 15) + '...' 
              : professional.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}>
              {professional.averageRating > 0 
                ? professional.averageRating.toFixed(1) 
                : '4.8'}
            </Text>
          </View>
        </View>

        <Text style={styles.profession} numberOfLines={1}>
          {professional.specializations.length > 0 
            ? professional.specializations[0].replace('_', ' ').toUpperCase()
            : 'Professional'}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={Colors.light.primary} />
            <Text style={styles.statText}>
              {formatSessionCount(professional.completedSessions)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="school-outline" size={14} color={Colors.light.secondary} />
            <Text style={styles.statText}>
              {formatExperience(professional.experience)}
            </Text>
          </View>
        </View>

        <View style={styles.availabilityContainer}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator, 
              professional.isAvailableForBooking 
                ? styles.availableIndicator 
                : styles.unavailableIndicator
            ]} />
            <Text style={[
              styles.statusText,
              professional.isAvailableForBooking 
                ? styles.availableText 
                : styles.unavailableText
            ]}>
              {professional.isAvailableForBooking ? 'Available' : 'Busy'}
            </Text>
          </View>

          <View style={styles.rateContainer}>
            <Ionicons name="wallet-outline" size={14} color={Colors.light.primary} />
            <Text style={styles.rateText}>₹{professional.hourlyRate}/hr</Text>
          </View>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: professional.profileImage || 'https://via.placeholder.com/150' 
          }}
          style={styles.professionalImage}
        />
        {professional.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
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
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 2,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  profession: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  availableIndicator: {
    backgroundColor: '#4CAF50',
  },
  unavailableIndicator: {
    backgroundColor: '#FF5722',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  availableText: {
    color: '#4CAF50',
  },
  unavailableText: {
    color: '#FF5722',
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  imageContainer: {
    position: 'relative',
  },
  professionalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
  },
}); 
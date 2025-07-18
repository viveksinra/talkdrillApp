import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import reviewService, { ReviewSubmissionData } from '@/api/services/reviewService';

const AVAILABLE_TAGS = [
  { id: 'helpful', label: '🙋‍♀️ Helpful', color: Colors.light.success },
  { id: 'patient', label: '⏰ Patient', color: Colors.light.primary },
  { id: 'knowledgeable', label: '🎓 Knowledgeable', color: Colors.light.info },
  { id: 'punctual', label: '⌚ Punctual', color: Colors.light.success },
  { id: 'engaging', label: '✨ Engaging', color: Colors.light.warning },
  { id: 'professional', label: '💼 Professional', color: Colors.light.primary },
  { id: 'friendly', label: '😊 Friendly', color: Colors.light.success },
  { id: 'clear_explanation', label: '💡 Clear Explanation', color: Colors.light.info },
  { id: 'motivating', label: '🚀 Motivating', color: Colors.light.warning }
];

export default function SessionReviewScreen() {
  const router = useRouter();
  const { bookingId, sessionId, professionalId, professionalName } = useLocalSearchParams();
  const { user } = useAuth();

  const [overallRating, setOverallRating] = useState(0);
  const [detailedRatings, setDetailedRatings] = useState({
    teaching: 0,
    communication: 0,
    patience: 0,
    punctuality: 0
  });
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    // Mark that session has been completed for review collection
    setSessionCompleted(true);
  }, []);

  const renderStarRating = (
    rating: number, 
    onRate: (rating: number) => void, 
    size: 'small' | 'large' = 'large'
  ) => {
    const starSize = size === 'large' ? 32 : 20;
    
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRate(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={starSize}
              color={star <= rating ? Colors.light.warning : Colors.light.inactive}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmitReview = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating for the session.');
      return;
    }

    try {
      setIsSubmitting(true);

      const reviewData: ReviewSubmissionData = {
        bookingId: bookingId as string,
        sessionId: sessionId as string,
        rating: overallRating,
        review: reviewText.trim() || undefined,
        detailedRatings: {
          teaching: detailedRatings.teaching || undefined,
          communication: detailedRatings.communication || undefined,
          patience: detailedRatings.patience || undefined,
          punctuality: detailedRatings.punctuality || undefined
        },
        tags: selectedTags.length > 0 ? selectedTags : undefined
      };

      await reviewService.submitReview(professionalId as string, reviewData);

      Alert.alert(
        'Review Submitted! 🎉',
        'Thank you for your feedback. Your review helps other students find great professionals.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(protected)/(tabs)')
          }
        ]
      );
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit review. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    Alert.alert(
      'Skip Review?',
      'Are you sure you want to skip leaving a review? Your feedback helps other students.',
      [
        { text: 'Leave Review', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => router.replace('/(protected)/(tabs)')
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
          options={{
            headerShown: true,
            title: 'Please Share Review.',
          }}
        />
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkipReview} style={styles.skipButton}>
            <ThemedText style={styles.skipButtonText}>Skip</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Rate Your Session</ThemedText>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Professional Info */}
          <View style={styles.professionalCard}>
            <View style={styles.professionalInfo}>
              <Ionicons name="person-circle" size={48} color={Colors.light.primary} />
              <View style={styles.professionalDetails}>
                <ThemedText style={styles.professionalName}>
                  {professionalName || 'Professional'}
                </ThemedText>
                <ThemedText style={styles.sessionCompleteText}>
                  Session completed! 🎉
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Overall Rating */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingHeader}>
              <Ionicons name="star" size={24} color={Colors.light.warning} />
              <ThemedText style={styles.ratingTitle}>Overall Rating</ThemedText>
            </View>
            <ThemedText style={styles.ratingDescription}>
              How would you rate your overall experience?
            </ThemedText>
            {renderStarRating(overallRating, setOverallRating)}
            {overallRating > 0 && (
              <ThemedText style={styles.ratingValue}>
                {overallRating} out of 5 stars
              </ThemedText>
            )}
          </View>

          {/* Detailed Ratings */}
          <View style={styles.detailedRatingsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.sectionTitle}>Detailed Ratings</ThemedText>
            </View>
            <ThemedText style={styles.sectionDescription}>
              Rate specific aspects of your session (optional)
            </ThemedText>

            {Object.entries({
              teaching: { label: 'Teaching Quality', icon: 'school' },
              communication: { label: 'Communication', icon: 'chatbubbles' },
              patience: { label: 'Patience', icon: 'heart' },
              punctuality: { label: 'Punctuality', icon: 'time' }
            }).map(([key, config]) => (
              <View key={key} style={styles.detailedRatingItem}>
                <View style={styles.detailedRatingHeader}>
                  <Ionicons name={config.icon as any} size={20} color={Colors.light.primary} />
                  <ThemedText style={styles.detailedRatingLabel}>
                    {config.label}
                  </ThemedText>
                </View>
                {renderStarRating(
                  detailedRatings[key as keyof typeof detailedRatings], 
                  (rating) => setDetailedRatings(prev => ({ ...prev, [key]: rating })),
                  'small'
                )}
              </View>
            ))}
          </View>

          {/* Tags */}
          <View style={styles.tagsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetags" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.sectionTitle}>Highlight Strengths</ThemedText>
            </View>
            <ThemedText style={styles.sectionDescription}>
              What made this professional great? (Select all that apply)
            </ThemedText>
            
            <View style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagButton,
                    {
                      backgroundColor: selectedTags.includes(tag.id) 
                        ? tag.color 
                        : Colors.light.surface,
                      borderColor: selectedTags.includes(tag.id) 
                        ? tag.color 
                        : Colors.light.primaryDark
                    }
                  ]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <ThemedText
                    style={[
                      styles.tagText,
                      {
                        color: selectedTags.includes(tag.id) 
                          ? Colors.light.background 
                          : Colors.light.text
                      }
                    ]}
                  >
                    {tag.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Written Review */}
          <View style={styles.reviewSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="create" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.sectionTitle}>Written Review</ThemedText>
            </View>
            <ThemedText style={styles.sectionDescription}>
              Share your experience to help other students (optional)
            </ThemedText>
            
            <TextInput
              style={styles.reviewInput}
              placeholder="What did you like about this session? How can other students benefit from learning with this professional?"
              placeholderTextColor={Colors.light.primaryLight}
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              maxLength={1000}
            />
            <ThemedText style={styles.characterCount}>
              {reviewText.length}/1000 characters
            </ThemedText>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: overallRating > 0 ? Colors.light.primary : Colors.light.inactive,
                opacity: overallRating > 0 ? 1 : 0.6
              }
            ]}
            onPress={handleSubmitReview}
            disabled={overallRating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.light.background} />
            ) : (
              <>
                <Ionicons name="send" size={24} color={Colors.light.background} />
                <ThemedText style={styles.submitButtonText}>Submit Review</ThemedText>
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
    backgroundColor: Colors.light.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondaryDark
  },
  skipButton: {
    padding: 8
  },
  skipButtonText: {
    fontSize: 16,
    color: Colors.light.secondaryDark
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text
  },
  headerRight: {
    width: 40
  },
  content: {
    flex: 1,
    padding: 16
  },
  professionalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.secondaryDark
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  professionalDetails: {
    flex: 1
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4
  },
  sessionCompleteText: {
    fontSize: 14,
    color: Colors.light.success
  },
  ratingSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.secondaryDark,
    alignItems: 'center'
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text
  },
  ratingDescription: {
    fontSize: 14,
    color: Colors.light.secondaryDark,
    textAlign: 'center',
    marginBottom: 16
  },
  starContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  starButton: {
    padding: 4
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.primary
  },
  detailedRatingsSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.secondaryDark
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.secondaryDark,
    marginBottom: 16
  },
  detailedRatingItem: {
    marginBottom: 16
  },
  detailedRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  detailedRatingLabel: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1
  },
  tagsSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.secondaryDark
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500'
  },
  reviewSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.secondaryDark
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: Colors.light.secondaryDark,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    textAlignVertical: 'top',
    minHeight: 100
  },
  characterCount: {
    fontSize: 12,
    color: Colors.light.secondaryDark,
    textAlign: 'right',
    marginTop: 4
  },
  submitContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.secondaryDark
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background
  }
}); 
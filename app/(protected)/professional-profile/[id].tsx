import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  fetchProfessionalDetails,
  fetchProfessionalAvailability,
  bookProfessionalSession,
  Professional,
  AvailabilitySlot,
} from '@/api/services/public/professionalService';
import { Colors } from '@/constants/Colors';

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    if (id) {
      loadProfessionalDetails();
    }
  }, [id]);

  useEffect(() => {
    if (selectedDate && id && showScheduleModal) {
      loadAvailability();
    }
  }, [selectedDate, id, showScheduleModal]);

  const loadProfessionalDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchProfessionalDetails(id!);
      setProfessional(data);
    } catch (error) {
      console.error('Error loading professional details:', error);
      Alert.alert('Error', 'Failed to load professional details');
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDates = () => {
    const today = new Date();
    const dates: string[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    setAvailableDates(dates);
    setSelectedDate(dates[0]); // Select today by default
  };

  const loadAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const slots = await fetchProfessionalAvailability(id!, selectedDate);
      setAvailabilitySlots(slots);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailabilitySlots([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleOpenScheduleModal = () => {
    generateAvailableDates();
    setShowScheduleModal(true);
    setSelectedSlot(''); // Reset selected slot
  };

  const handleBookSession = async () => {
    if (!selectedSlot || !selectedDate || !professional) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    setBookingLoading(true);
    try {
      await bookProfessionalSession({
        professionalId: professional._id,
        scheduledDate: selectedDate,
        scheduledTime: selectedSlot,
        topic: 'General Conversation',
      });

      setShowScheduleModal(false);
      Alert.alert(
        'Success',
        'Session booked successfully! You will receive a confirmation notification. The session will start when you both join the video call.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error booking session:', error);
      Alert.alert('Error', error.message || 'Failed to book session');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatSpecialization = (spec: string) => {
    return spec.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Mock gallery images for now - in real app, this would come from the professional's data
  const galleryImages = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=300&fit=crop',
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading professional...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!professional) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="red" />
          <Text style={styles.errorText}>Professional not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerShown: true,
        title: professional.name
      }} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section - Matching Screenshot */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: professional.profileImage || 'https://via.placeholder.com/150' }}
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.professionalName}>{professional.name}</Text>
            <Text style={styles.professionalTitle}>
              {professional.specializations.length > 0 
                ? formatSpecialization(professional.specializations[0])
                : 'Senior Software Engineer'}
            </Text>

            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#FFC107" />
                <Text style={styles.ratingBadgeText}>
                  {professional.averageRating > 0 
                    ? professional.averageRating.toFixed(1) 
                    : '4.9'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRowTop}>
              <View style={styles.statBadge}>
                <Ionicons name="time-outline" size={14} color="#2196F3" />
                <Text style={styles.statBadgeText}>
                  {professional.completedSessions} sessions
                </Text>
              </View>

              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>

            <View style={styles.companyBadge}>
              <Ionicons name="code-slash" size={14} color="#2196F3" />
              <Text style={styles.companyBadgeText}>Google Engineer</Text>
            </View>

            <View style={styles.statsRowBottom}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{professional.experience}+ years exp.</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {professional.totalSessions > 1000 
                    ? `${(professional.totalSessions / 1000).toFixed(1)}k` 
                    : professional.totalSessions} students
                </Text>
              </View>
            </View>

            <Text style={styles.languagesText}>
              {professional.languages.map(l => 
                l.language.charAt(0).toUpperCase() + l.language.slice(1)
              ).join(', ')}
            </Text>
          </View>
        </View>

        {/* Gallery Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gallery</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
          >
            {galleryImages.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.galleryImage}
              />
            ))}
          </ScrollView>
        </View>

        {/* Background Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background</Text>
          <Text style={styles.backgroundText}>
            {professional.bio || 
            `Senior Software Engineer with over ${professional.experience} years of experience in full-stack development and system architecture. Specializes in scalable systems and cloud architecture. Currently working at Google, leading technical teams and mentoring developers. Passionate about teaching software engineering best practices and helping developers grow in their careers.`
            }
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={handleOpenScheduleModal}
          >
            <Ionicons name="calendar" size={20} color="#5933F9" />
            <Text style={styles.scheduleButtonText}>Schedule Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Schedule Session</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Professional Info */}
            <View style={styles.modalProfessionalInfo}>
              <Image
                source={{ uri: professional?.profileImage || 'https://via.placeholder.com/60' }}
                style={styles.modalProfessionalImage}
              />
              <View>
                <Text style={styles.modalProfessionalName}>{professional?.name}</Text>
                <Text style={styles.modalProfessionalTitle}>
                  {professional?.specializations.length > 0 
                    ? formatSpecialization(professional.specializations[0])
                    : 'Senior Software Engineer'}
                </Text>
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Select Date</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.dateScroll}
              >
                {availableDates.map((date) => (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateButton,
                      selectedDate === date && styles.selectedDateButton
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dateButtonText,
                      selectedDate === date && styles.selectedDateButtonText
                    ]}>
                      {formatDate(date)}
                    </Text>
                    <Text style={[
                      styles.dateButtonSubtext,
                      selectedDate === date && styles.selectedDateButtonSubtext
                    ]}>
                      {new Date(date).getDate()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time Slots */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Available Times</Text>
              {loadingAvailability ? (
                <View style={styles.loadingSlots}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                  <Text style={styles.loadingSlotsText}>Loading available times...</Text>
                </View>
              ) : availabilitySlots.length > 0 ? (
                <View style={styles.slotsGrid}>
                  {availabilitySlots
                    .filter(slot => slot.isAvailable)
                    .map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotButton,
                        selectedSlot === slot.startTime && styles.selectedSlotButton
                      ]}
                      onPress={() => setSelectedSlot(slot.startTime)}
                    >
                      <Text style={[
                        styles.slotButtonText,
                        selectedSlot === slot.startTime && styles.selectedSlotButtonText
                      ]}>
                        {formatTime(slot.startTime)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noSlotsContainer}>
                  <Ionicons name="calendar-outline" size={48} color={Colors.light.secondary} />
                  <Text style={styles.noSlotsText}>No available slots for this date</Text>
                  <Text style={styles.noSlotsSubtext}>Please try another date</Text>
                </View>
              )}
            </View>

            {/* Session Info */}
            {selectedSlot && (
              <View style={styles.sessionInfoContainer}>
                <View style={styles.sessionInfoHeader}>
                  <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                  <Text style={styles.sessionInfoTitle}>Session Details</Text>
                </View>
                <Text style={styles.sessionInfoText}>
                  • Session will start when both you and the professional join the video call
                </Text>
                <Text style={styles.sessionInfoText}>
                  • Recording will only begin after the call starts
                </Text>
                <Text style={styles.sessionInfoText}>
                  • Duration: 30 minutes
                </Text>
                <Text style={styles.sessionInfoText}>
                  • You'll receive a notification before the session
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Book Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.bookButton,
                (!selectedSlot || bookingLoading) && styles.bookButtonDisabled
              ]}
              onPress={handleBookSession}
              disabled={!selectedSlot || bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.bookButtonText}>
                    Book Session {selectedSlot ? `- ${formatTime(selectedSlot)}` : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
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
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.light.background,
    marginBottom: 12,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  professionalTitle: {
    fontSize: 16,
    color: Colors.light.secondary,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingBadgeText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF8F00',
  },
  statsRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  companyBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  statsRowBottom: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 20,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  languagesText: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  section: {
    backgroundColor: Colors.light.background,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  galleryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  galleryImage: {
    width: 280,
    height: 160,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: Colors.light.surface,
  },
  backgroundText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
  },
  actionButtons: {
    padding: 20,
    backgroundColor: Colors.light.background,
    gap: 12,
  },
  scheduleButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5933F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  scheduleButtonText: {
    color: '#5933F9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalProfessionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
  },
  modalProfessionalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  modalProfessionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalProfessionalTitle: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  dateScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDateButton: {
    backgroundColor: '#5933F9',
    borderColor: '#5933F9',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  selectedDateButtonText: {
    color: '#FFFFFF',
  },
  dateButtonSubtext: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  selectedDateButtonSubtext: {
    color: '#FFFFFF',
  },
  loadingSlots: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingSlotsText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.secondary,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
    alignItems: 'center',
  },
  selectedSlotButton: {
    backgroundColor: '#5933F9',
    borderColor: '#5933F9',
  },
  slotButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedSlotButtonText: {
    color: '#FFFFFF',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 4,
  },
  sessionInfoContainer: {
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  sessionInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 8,
  },
  sessionInfoText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface,
  },
  bookButton: {
    backgroundColor: '#5933F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonDisabled: {
    backgroundColor: Colors.light.secondary,
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
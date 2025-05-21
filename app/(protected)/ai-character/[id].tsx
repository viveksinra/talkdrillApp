import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import {Colors} from '../../../constants/Colors';
import { fetchAICharacterDetails, startConversation } from '../../../api/services/public/aiCharacters';

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  gender: string;
  age: number;
  languages: string[];
  expertiseLevel: string;
  background: string;
  teachingStyle: string;
  personality: string;
  profileImage: string;
  tags: string[];
  rating?: number;
  sessions?: number;
  verified?: boolean;
  institution?: string;
  experience?: string;
  students?: string;
  languageProficiency?: {language: string, level: string}[];
  specializations?: string[];
  certifications?: {title: string, icon: string}[];
  reviews?: {name: string, rating: number, text: string, date: string, avatar: string}[];
  galleryImages?: string[];
  sessionPrice?: string;
}

export default function AICharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [character, setCharacter] = useState<AICharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingCall, setStartingCall] = useState(false);
  
  useEffect(() => {
    if (!id) {
      setError('Character ID is required');
      setLoading(false);
      return;
    }
    
    loadCharacterDetails();
  }, [id]);
  
  const loadCharacterDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchAICharacterDetails(id as string);
      // Enhance data with mock values to match the design
      const enhancedData = {
        ...data,
        rating: 4.9,
        sessions: 238,
        verified: true,
        institution: 'Stanford Medical',
        experience: '10+ years exp.',
        students: '2.5k students',
        languageProficiency: [
          {language: 'English', level: 'Native'},
          {language: 'Spanish', level: 'C1'},
          {language: 'Mandarin', level: 'B2'},
        ],
        specializations: ['Internal Medicine', 'Medical Terminology', 'Clinical Communication', 
                          'Patient Care', 'Healthcare English', 'Medical Ethics'],
        certifications: [
          {title: 'Board Certified MD', icon: 'user-md'},
          {title: 'Top Medical Instructor', icon: 'trophy'},
          {title: 'Verified Professional', icon: 'check-circle'},
        ],
        reviews: [
          {
            name: 'James Rodriguez',
            rating: 5,
            text: "Dr. Lee's expertise in medical terminology and patient communication is exceptional. Very helpful for my medical residency preparation. She provided clear explanations and practical examples that I could immediately apply in my clinical practice.",
            date: '3 days ago',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          },
          {
            name: 'Sarah Mitchell',
            rating: 5,
            text: "Outstanding medical English instruction. Dr. Lee's clinical experience adds tremendous value to her teaching approach.",
            date: '1 week ago',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          },
        ],
        galleryImages: [
          'https://images.unsplash.com/photo-1551076805-e1869033e561',
          'https://images.unsplash.com/photo-1576091160550-2173dba999ef',
        ],
        sessionPrice: '$0.80/min',
      };
      setCharacter(enhancedData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load character details. Please try again later.');
      setLoading(false);
      console.error('Error loading character details:', err);
    }
  };
  
  const handleStartConversation = async (callType: 'chat' | 'audio' | 'video') => {
    if (!character) return;
    
    try {
      setStartingCall(true);
      const conversation = await startConversation(character._id, callType);
      
      // Navigate to appropriate screen based on call type
      if (callType === 'chat') {
        router.push({
          pathname: '/(protected)/ai-chat/[id]',
          params: { id: conversation._id }
        });
      } else {
        router.push({
          pathname: '/(protected)/ai-video/[id]',
          params: { id: conversation._id }
        });
      }
      
      setStartingCall(false);
    } catch (err) {
      setStartingCall(false);
      Alert.alert('Error', 'Failed to start conversation. Please try again later.');
      console.error('Error starting conversation:', err);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map(i => (
          <FontAwesome 
            key={i} 
            name="star" 
            size={18} 
            color={i <= Math.round(rating) ? '#FFA500' : '#DDDDDD'} 
          />
        ))}
        <Text style={styles.ratingValue}>{rating}</Text>
      </View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading tutor details...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !character) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error || 'Character not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCharacterDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: "AI Character" }} />
      <ScrollView showsVerticalScrollIndicator={false} style={{marginBottom: 100}}>
        
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: character.profileImage || 'https://via.placeholder.com/150' }}
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Dr. {character.name}</Text>
            <Text style={styles.profession}>{character.profession}</Text>
            
            <View style={styles.badgesContainer}>
              <View style={styles.ratingBadge}>
                {renderStars(character.rating || 4.5)}
              </View>
              
              <View style={styles.sessionsBadge}>
                <Ionicons name="time-outline" size={20} color="#4B61DD" />
                <Text style={styles.badgeText}>{character.sessions} sessions</Text>
              </View>
              
              {character.verified && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={20} color="#25D366" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity style={styles.institutionBadge}>
              <Ionicons name="school-outline" size={20} color="#4B61DD" />
              <Text style={styles.institutionText}>{character.institution}</Text>
            </TouchableOpacity>
            
            <View style={styles.statsContainer}>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>{character.experience}</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>{character.students}</Text>
              </View>
            </View>
            
            <View style={styles.languagesContainer}>
              <Text style={styles.languagesText}>
                {character.languageProficiency?.map((lang, i) => 
                  `${lang.language}${i < (character.languageProficiency?.length || 0) - 1 ? ', ' : ''}`
                )}
              </Text>
            </View>
          </View>
        </View>
        
        {character.galleryImages && character.galleryImages.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryContainer}>
              {character.galleryImages.map((img, index) => (
                <Image 
                  key={index} 
                  source={{ uri: img }} 
                  style={styles.galleryImage} 
                />
              ))}
            </ScrollView>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background</Text>
          <Text style={styles.sectionText}>{character.background}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.tagsContainer}>
            {character.specializations?.map((specialization, index) => (
              <View key={`spec-${index}`} style={styles.specializationTag}>
                <Text style={styles.specializationTagText}>{specialization}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <View style={styles.certificationsContainer}>
            {character.certifications?.map((cert, index) => (
              <View key={`cert-${index}`} style={styles.certificationBadge}>
                <FontAwesome name={cert.icon as any} size={20} color="#4B61DD" />
                <Text style={styles.certificationText}>{cert.title}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.languageProficiencyContainer}>
            {character.languageProficiency?.map((lang, index) => (
              <View key={`lang-prof-${index}`} style={styles.languageBadge}>
                <FontAwesome name="flag" size={16} color="#000" />
                <Text style={styles.languageName}>{lang.language}</Text>
                <Text style={styles.languageLevel}>({lang.level})</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Options</Text>
          <View style={styles.sessionOptionCard}>
            <View style={styles.sessionOptionIconContainer}>
              <Ionicons name="chatbubbles-outline" size={24} color="#4B61DD" />
            </View>
            <View style={styles.sessionOptionDetails}>
              <Text style={styles.sessionOptionTitle}>Medical English Session</Text>
              <Text style={styles.sessionOptionDescription}>Clinical terminology & communication</Text>
              <View style={styles.sessionFeature}>
                <Ionicons name="checkmark-circle" size={16} color="#25D366" />
                <Text style={styles.sessionFeatureText}>Specialized medical vocabulary</Text>
              </View>
            </View>
            <View style={styles.sessionPriceContainer}>
              <Text style={styles.sessionPrice}>{character.sessionPrice}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.overallRating}>
              {renderStars(character.rating || 4.5)}
              <Text style={styles.reviewCount}>({character.sessions})</Text>
            </View>
          </View>
          
          {character.reviews?.map((review, index) => (
            <View key={`review-${index}`} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={{ uri: review.avatar }} style={styles.reviewerAvatar} />
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>{review.name}</Text>
                  <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <FontAwesome 
                        key={i} 
                        name="star" 
                        size={14} 
                        color={i <= review.rating ? '#FFA500' : '#DDDDDD'} 
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
          
          <TouchableOpacity style={styles.viewAllReviewsButton}>
            <Text style={styles.viewAllReviewsText}>View All Reviews</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Options</Text>
          <View style={styles.contactOptionsContainer}>
            <TouchableOpacity style={styles.contactOption}>
              <View style={[styles.contactIconContainer, styles.messageIcon]}>
                <Ionicons name="mail-outline" size={24} color="#4B61DD" />
              </View>
              <Text style={styles.contactOptionText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactOption}>
              <View style={[styles.contactIconContainer, styles.callIcon]}>
                <Ionicons name="call-outline" size={24} color="#25D366" />
              </View>
              <Text style={styles.contactOptionText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactOption}>
              <View style={[styles.contactIconContainer, styles.questionIcon]}>
                <Ionicons name="help-circle-outline" size={24} color="#9370DB" />
              </View>
              <Text style={styles.contactOptionText}>Ask Question</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactOption}>
              <View style={[styles.contactIconContainer, styles.reportIcon]}>
                <Ionicons name="flag-outline" size={24} color="#FF6347" />
              </View>
              <Text style={styles.contactOptionText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        
        
        {startingCall && (
          <ActivityIndicator 
            style={styles.callLoader} 
            size="small" 
            color={Colors.light.primary} 
          />
        )}
      </ScrollView>
      <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.startSessionButton}
            onPress={() => handleStartConversation('video')}
            disabled={startingCall}
          >
            <Ionicons name="videocam-outline" size={20} color="white" />
            <Text style={styles.startSessionText}>Start a Call</Text>
          </TouchableOpacity>
          
         
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4B61DD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profession: {
    fontSize: 18,
    color: '#555',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFA500',
  },
  sessionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4B61DD',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F9EF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  verifiedText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#25D366',
    fontWeight: '500',
  },
  institutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  institutionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4B61DD',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statBadge: {
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    color: '#555',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languagesText: {
    fontSize: 16,
    color: '#333',
  },
  gallerySection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  galleryContainer: {
    marginTop: 12,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  actionButtonsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  startSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B61DD',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  startSessionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scheduleSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B61DD',
  },
  scheduleSessionText: {
    color: '#4B61DD',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationTag: {
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  specializationTagText: {
    fontSize: 14,
    color: '#555',
  },
  certificationsContainer: {
    marginTop: 8,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  certificationText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#4B61DD',
    fontWeight: '500',
  },
  languageProficiencyContainer: {
    marginTop: 8,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  languageName: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  languageLevel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#888',
  },
  sessionOptionCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
  },
  sessionOptionIconContainer: {
    marginRight: 16,
  },
  sessionOptionDetails: {
    flex: 1,
  },
  sessionOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionOptionDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  sessionFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionFeatureText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  sessionPriceContainer: {
    justifyContent: 'center',
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.1)',
  },
  sessionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B61DD',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    marginLeft: 8,
    fontSize: 16,
    color: '#888',
  },
  reviewCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 14,
    color: '#888',
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  viewAllReviewsButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllReviewsText: {
    fontSize: 16,
    color: '#4B61DD',
    fontWeight: '500',
  },
  contactOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactOption: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageIcon: {
    backgroundColor: '#E6ECFF',
  },
  callIcon: {
    backgroundColor: '#E9F9EF',
  },
  questionIcon: {
    backgroundColor: '#F3EAFA',
  },
  reportIcon: {
    backgroundColor: '#FFEFEB',
  },
  contactOptionText: {
    fontSize: 14,
    color: '#333',
  },
  bottomActionButtonsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  callLoader: {
    marginTop: 16,
    alignSelf: 'center',
  },
}); 
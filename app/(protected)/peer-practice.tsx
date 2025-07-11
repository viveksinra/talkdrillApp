import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useSocket } from '@/contexts/SocketContext';
import { FilterDialog, FilterOptions } from '@/components/FilterDialog';
import { useAuth } from '@/contexts/AuthContext';

export default function PeerPracticeScreen() {
  const router = useRouter();
  const { onlineUsers } = useSocket();
  const { user } = useAuth();
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);

  const handleStartPracticeCall = () => {
    setFilterDialogVisible(true);
   
  };

  async function handleStartMatching(filters: FilterOptions, coinCost: number) {
     const userGender = user?.gender || "male"; // Default to male if not set'
    router.push({
        pathname: "/match-making",
        params: {
          userGender: userGender,
          partnerGender: filters.gender,
          languageProficiency: filters.englishLevel,
          coinCostPer5Min: coinCost.toString(), // Pass calculated cost
        },
      });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Peer Practice',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('@/assets/images/peer-practice-icon.jpg')}
            style={styles.heroIcon}
            defaultSource={require('@/assets/images/peer-practice-icon.jpg')}
          />
              <ThemedText style={styles.heroTitle}>Peer Practice</ThemedText>
      
          <ThemedText style={styles.heroSubtitle}>
            Connect with language partners around the world
          </ThemedText>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <ThemedText style={styles.description}>
            Practice your English skills in real conversations with other learners. 
            You'll be connected for an audio call that can switch to video.
          </ThemedText>
        </View>

        {/* How it works section */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.light.primary} />
            <ThemedText style={styles.sectionTitle}>How it works:</ThemedText>
          </View>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepBullet} />
              <ThemedText style={styles.stepText}>Start with an audio call</ThemedText>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepBullet} />
              <ThemedText style={styles.stepText}>Switch to video if you both agree</ThemedText>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepBullet} />
              <ThemedText style={styles.stepText}>Practice speaking for 5-15 minutes</ThemedText>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepBullet} />
              <ThemedText style={styles.stepText}>Rate each other after the call</ThemedText>
            </View>
          </View>
        </View>

        {/* Online users indicator */}
        <View style={styles.onlineUsersSection}>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <ThemedText style={styles.onlineText}>
              {onlineUsers.length
                ? onlineUsers.length - 1 === 1
                  ? "1 user online now"
                  : onlineUsers.length - 1 > 1
                  ? `${onlineUsers.length - 1} users online now`
                  : "No users online now"
                : "No users online now"}
            </ThemedText>
          </View>
        </View>

        {/* Practice Tips */}
        <View style={styles.tipsSection}>
          <ThemedText style={styles.tipsTitle}>Practice Tips</ThemedText>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color={Colors.light.primary} />
            <View style={styles.tipContent}>
              <ThemedText style={styles.tipTitle}>Start with simple topics</ThemedText>
              <ThemedText style={styles.tipDescription}>
                Begin with introductions and basic questions about hobbies or interests.
              </ThemedText>
            </View>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="chatbubble-outline" size={20} color="#FFA726" />
            <View style={styles.tipContent}>
              <ThemedText style={styles.tipTitle}>Speak slowly and clearly</ThemedText>
              <ThemedText style={styles.tipDescription}>
                Take your time and pronounce words carefully to be understood.
              </ThemedText>
            </View>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="help-circle-outline" size={20} color="#4CAF50" />
            <View style={styles.tipContent}>
              <ThemedText style={styles.tipTitle}>Ask for clarification</ThemedText>
              <ThemedText style={styles.tipDescription}>
                Don't be afraid to ask your partner to repeat or explain something.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Suggested Topics */}
        <View style={styles.topicsSection}>
          <ThemedText style={styles.topicsTitle}>Suggested Conversation Topics</ThemedText>
          
          <View style={styles.topicsGrid}>
            <View style={styles.topicCard}>
              <Ionicons name="airplane" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.topicText}>Travel Experiences</ThemedText>
            </View>
            
            <View style={styles.topicCard}>
              <Ionicons name="film" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.topicText}>Favorite Movies</ThemedText>
            </View>
            
            <View style={styles.topicCard}>
              <Ionicons name="restaurant" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.topicText}>Food & Cuisine</ThemedText>
            </View>
            
            <View style={styles.topicCard}>
              <Ionicons name="game-controller" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.topicText}>Hobbies & Interests</ThemedText>
            </View>
            
            <View style={styles.topicCard}>
              <Ionicons name="star" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.topicText}>Future Goals</ThemedText>
            </View>
            
            <View style={styles.topicCard}>
              <Ionicons name="globe" size={24} color={Colors.light.primary} />
              <ThemedText style={styles.topicText}>Cultural Differences</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Call Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={styles.startCallButton} 
          onPress={handleStartPracticeCall}
        >
          <Ionicons name="call" size={24} color="white" />
          <ThemedText style={styles.startCallText}>Start Practice Call</ThemedText>
        </TouchableOpacity>
      </View>

      <FilterDialog
        headerTitle={'Find Peer'}
        headerSubtitle={'Customize your conversation peer'}
        visible={filterDialogVisible}
        onClose={() => setFilterDialogVisible(false)}
        onApply={handleStartMatching}
        context="peer-practice" // Add context
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerRight: {
    marginRight: 16,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  heroSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: Colors.light.secondary,
  },
  descriptionSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: Colors.light.text,
  },
  howItWorksSection: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    color: Colors.light.primary,
  },
  stepsList: {
    paddingLeft: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginRight: 12,
  },
  stepText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  onlineUsersSection: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  onlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  tipsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  topicsSection: {
    paddingHorizontal: 16,
    marginBottom: 100, // Space for bottom button
  },
  topicsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  topicCard: {
    width: '48%',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  topicText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  startCallButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startCallText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
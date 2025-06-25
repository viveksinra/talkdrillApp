import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  getStreakStats,
  getStreakData,
  getStreakEmoji,
  getStreakMessage,
  type StreakStats,
  type StreakData
} from '@/api/services/streakService';
import WeeklyProgressCard from '@/components/streak/WeeklyProgressCard';
import StreakCalendar from '@/components/streak/StreakCalendar';
import MilestoneProgress from '@/components/streak/MilestoneProgress';

const { width } = Dimensions.get('window');

export default function StreakDashboardScreen() {
  const router = useRouter();
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load streak data
  const loadData = useCallback(async () => {
    try {
      const [stats, data] = await Promise.all([
        getStreakStats(),
        getStreakData()
      ]);
      
      setStreakStats(stats);
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data:', error);
      Alert.alert('Error', 'Failed to load streak data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getActivityTypeIcon = (activity: string) => {
    switch (activity) {
      case 'ai_chat': return 'message.fill';
      case 'ai_call': return 'phone.fill';
      case 'peer_chat': return 'bubble.left.and.bubble.right.fill';
      case 'peer_call': return 'video.fill';
      default: return 'checkmark.circle.fill';
    }
  };

  const getActivityTypeLabel = (activity: string) => {
    switch (activity) {
      case 'ai_chat': return 'AI Chat';
      case 'ai_call': return 'AI Call';
      case 'peer_chat': return 'Peer Chat';
      case 'peer_call': return 'Peer Call';
      case 'manual_checkin': return 'Check-in';
      default: return 'Activity';
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Streak Dashboard',
            headerBackTitle: 'Back',
          }}
        />
        <ActivityIndicator size="large" color="#4A86E8" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Streak Dashboard',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Main Streak Display */}
        {streakStats && (
          <ThemedView style={styles.mainStreakCard}>
            <View style={styles.streakHeader}>
              <ThemedText style={styles.streakEmoji}>
                {getStreakEmoji(streakStats.current)}
              </ThemedText>
              <View style={styles.streakInfo}>
                <ThemedText type="title" style={styles.currentStreak}>
                  {streakStats.current}
                </ThemedText>
                <ThemedText style={styles.streakLabel}>Day Streak</ThemedText>
                <ThemedText style={styles.streakMessage}>
                  {getStreakMessage(streakStats.current)}
                </ThemedText>
              </View>
            </View>

            {/* Best Streak */}
            <View style={styles.bestStreakSection}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {streakStats.highest.count}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Best Streak</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {streakStats.totalEarnings.activeDays}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Active Days</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {streakStats.totalEarnings.coinsFromStreaks}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Coins Earned</ThemedText>
              </View>
            </View>
          </ThemedView>
        )}

        {/* Today's Progress */}
        {streakStats && (
          <ThemedView style={styles.todayCard}>
            <View style={styles.cardHeader}>
              <IconSymbol size={24} name="calendar" color="#4A86E8" />
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                Today's Progress
              </ThemedText>
            </View>
            
            <View style={styles.progressContent}>
              <View style={styles.activityStatus}>
                <View style={[
                  styles.activityIndicator,
                  streakStats.todayActivity.hasActivity && styles.activityIndicatorActive
                ]}>
                  <IconSymbol 
                    size={20} 
                    name={streakStats.todayActivity.hasActivity ? "checkmark" : "plus"} 
                    color={streakStats.todayActivity.hasActivity ? "#4CAF50" : "#999"} 
                  />
                </View>
                <View style={styles.activityDetails}>
                  <ThemedText style={[
                    styles.activityText,
                    streakStats.todayActivity.hasActivity && styles.activityTextComplete
                  ]}>
                    {streakStats.todayActivity.hasActivity 
                      ? `${streakStats.todayActivity.activitiesCount} activities completed` 
                      : 'No activities yet today'
                    }
                  </ThemedText>
                  {streakStats.todayActivity.hasActivity && streakStats.todayActivity.breakdown && (
                    <View style={styles.rewardsBreakdown}>
                      <ThemedText style={styles.rewardText}>
                        Base: {streakStats.todayActivity.breakdown.baseReward} coins
                      </ThemedText>
                      {streakStats.todayActivity.breakdown.streakBonus > 0 && (
                        <ThemedText style={styles.bonusText}>
                          Bonus: +{streakStats.todayActivity.breakdown.streakBonus} coins
                        </ThemedText>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {!streakStats.todayActivity.hasActivity && (
                <ThemedText style={styles.encouragementText}>
                  Complete any session to continue your streak!
                </ThemedText>
              )}
            </View>
          </ThemedView>
        )}

        {/* Milestone Progress Component */}
        {streakStats && (
          <MilestoneProgress
            currentStreak={streakStats.current}
            nextMilestone={streakStats.nextMilestone}
            totalEarnings={streakStats.totalEarnings}
          />
        )}

        {/* Activity Calendar */}
        {streakData && (
          <StreakCalendar
            activities={streakData.recentActivities}
            currentStreak={streakStats?.current || 0}
            onDatePress={(date) => {
              Alert.alert('Activity Details', `View details for ${date}`);
            }}
          />
        )}

        {/* Recent Activity Timeline */}
        {streakData && streakData.recentActivities.length > 0 && (
          <ThemedView style={styles.timelineCard}>
            <View style={styles.cardHeader}>
              <IconSymbol size={24} name="clock.fill" color="#8E8E93" />
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                Recent Activity
              </ThemedText>
            </View>
            
            <View style={styles.timeline}>
              {streakData.recentActivities.slice(0, 7).map((activity, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <ThemedText style={styles.timelineDate}>
                        {formatDate(activity.date)}
                      </ThemedText>
                      <ThemedText style={styles.timelineStreak}>
                        Day {activity.streakDay}
                      </ThemedText>
                    </View>
                    <View style={styles.timelineDetails}>
                      <ThemedText style={styles.timelineActivity}>
                        {activity.activitiesCount} activities
                      </ThemedText>
                      {activity.coinsEarned > 0 && (
                        <View style={styles.coinsEarned}>
                          <IconSymbol size={14} name="bitcoinsign.circle.fill" color="#F5A623" />
                          <ThemedText style={styles.coinsText}>
                            +{activity.coinsEarned}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ThemedView>
        )}

        {/* Quick Actions */}
        <ThemedView style={styles.actionsCard}>
          <ThemedText type="defaultSemiBold" style={styles.actionsTitle}>
            Quick Actions
          </ThemedText>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/ai-characters')}
            >
              <IconSymbol size={24} name="message.fill" color="#4A86E8" />
              <ThemedText style={styles.actionButtonText}>AI Chat</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/users')}
            >
              <IconSymbol size={24} name="person.2.fill" color="#34C759" />
              <ThemedText style={styles.actionButtonText}>Find Partner</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/coins')}
            >
              <IconSymbol size={24} name="bitcoinsign.circle.fill" color="#F5A623" />
              <ThemedText style={styles.actionButtonText}>View Coins</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  mainStreakCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    alignItems: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  streakInfo: {
    alignItems: 'center',
  },
  currentStreak: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  streakMessage: {
    fontSize: 14,
    color: '#4A86E8',
    textAlign: 'center',
    fontWeight: '500',
  },
  bestStreakSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  todayCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginLeft: 8,
    color: '#333',
  },
  progressContent: {
    gap: 12,
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIndicatorActive: {
    backgroundColor: '#E8F5E8',
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  activityTextComplete: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  rewardsBreakdown: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardText: {
    fontSize: 14,
    color: '#666',
  },
  bonusText: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '500',
  },
  encouragementText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  milestoneCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  milestoneContent: {
    gap: 16,
  },
  milestoneInfo: {
    alignItems: 'center',
  },
  milestoneTarget: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  milestoneReward: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: '500',
  },
  progressContainer: {
    gap: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timelineCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A86E8',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  timelineStreak: {
    fontSize: 12,
    color: '#4A86E8',
    fontWeight: '500',
  },
  timelineDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineActivity: {
    fontSize: 14,
    color: '#666',
  },
  coinsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsText: {
    fontSize: 12,
    color: '#F5A623',
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 
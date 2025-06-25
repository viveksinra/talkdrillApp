import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface MilestoneProgressProps {
  currentStreak: number;
  nextMilestone?: {
    type: 'weekly' | 'monthly';
    target: number;
    remaining: number;
    reward: number;
  } | null;
  totalEarnings: {
    coinsFromStreaks: number;
    activeDays: number;
  };
}

export default function MilestoneProgress({
  currentStreak,
  nextMilestone,
  totalEarnings
}: MilestoneProgressProps) {
  
  const getMilestones = () => {
    const milestones = [];
    
    // Weekly milestones (every 7 days)
    for (let i = 7; i <= 100; i += 7) {
      milestones.push({
        type: 'weekly' as const,
        target: i,
        reward: 10,
        achieved: currentStreak >= i
      });
    }
    
    // Monthly milestones (every 30 days)
    for (let i = 30; i <= 365; i += 30) {
      milestones.push({
        type: 'monthly' as const,
        target: i,
        reward: 30,
        achieved: currentStreak >= i
      });
    }
    
    // Special milestones
    milestones.push(
      { type: 'special' as const, target: 100, reward: 100, achieved: currentStreak >= 100, name: 'Century Club' },
      { type: 'special' as const, target: 365, reward: 365, achieved: currentStreak >= 365, name: 'Year Master' }
    );
    
    return milestones.sort((a, b) => a.target - b.target);
  };

  const getProgressPercentage = () => {
    if (!nextMilestone) return 100;
    const progress = nextMilestone.target - nextMilestone.remaining;
    return Math.min(100, (progress / nextMilestone.target) * 100);
  };

  const getMilestoneIcon = (type: string, achieved: boolean) => {
    if (achieved) {
      switch (type) {
        case 'weekly': return '🔥';
        case 'monthly': return '⭐';
        case 'special': return '💯';
        default: return '✅';
      }
    } else {
      switch (type) {
        case 'weekly': return '🎯';
        case 'monthly': return '🌟';
        case 'special': return '🏆';
        default: return '⭕';
      }
    }
  };

  const milestones = getMilestones();
  const upcomingMilestones = milestones.filter(m => !m.achieved).slice(0, 3);
  const recentAchievements = milestones.filter(m => m.achieved).slice(-3);

  return (
    <ThemedView style={styles.container}>
      {/* Current Progress */}
      <View style={styles.currentProgress}>
        <View style={styles.progressHeader}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            Milestone Progress
          </ThemedText>
          <View style={styles.streakBadge}>
            <ThemedText style={styles.streakText}>{currentStreak} days</ThemedText>
          </View>
        </View>

        {nextMilestone && (
          <View style={styles.nextMilestoneCard}>
            <View style={styles.milestoneHeader}>
              <View style={styles.milestoneInfo}>
                <ThemedText style={styles.milestoneTitle}>
                  Next: {nextMilestone.target}-Day {nextMilestone.type.charAt(0).toUpperCase() + nextMilestone.type.slice(1)}
                </ThemedText>
                <ThemedText style={styles.milestoneReward}>
                  +{nextMilestone.reward} bonus coins
                </ThemedText>
              </View>
              <View style={styles.remainingDays}>
                <ThemedText style={styles.remainingNumber}>
                  {nextMilestone.remaining}
                </ThemedText>
                <ThemedText style={styles.remainingLabel}>days left</ThemedText>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${getProgressPercentage()}%` }
                  ]} 
                />
              </View>
              <ThemedText style={styles.progressText}>
                {Math.round(getProgressPercentage())}% complete
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Recent Achievements
          </ThemedText>
          <View style={styles.achievementsList}>
            {recentAchievements.map((milestone, index) => (
              <View key={index} style={styles.achievementItem}>
                <ThemedText style={styles.achievementIcon}>
                  {getMilestoneIcon(milestone.type, true)}
                </ThemedText>
                <View style={styles.achievementDetails}>
                  <ThemedText style={styles.achievementName}>
                    {milestone.type === 'special' ? (milestone as any).name : `${milestone.target}-Day ${milestone.type.charAt(0).toUpperCase() + milestone.type.slice(1)}`}
                  </ThemedText>
                  <ThemedText style={styles.achievementReward}>
                    +{milestone.reward} coins earned
                  </ThemedText>
                </View>
                <IconSymbol size={16} name="checkmark.circle.fill" color="#4CAF50" />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Upcoming Milestones */}
      <View style={styles.upcomingSection}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Upcoming Milestones
        </ThemedText>
        <View style={styles.milestonesList}>
          {upcomingMilestones.map((milestone, index) => (
            <View key={index} style={styles.milestoneItem}>
              <ThemedText style={styles.milestoneItemIcon}>
                {getMilestoneIcon(milestone.type, false)}
              </ThemedText>
              <View style={styles.milestoneDetails}>
                <ThemedText style={styles.milestoneName}>
                  {milestone.type === 'special' ? (milestone as any).name : `${milestone.target}-Day ${milestone.type.charAt(0).toUpperCase() + milestone.type.slice(1)}`}
                </ThemedText>
                <ThemedText style={styles.milestoneTarget}>
                  {milestone.target - currentStreak} days to go
                </ThemedText>
              </View>
              <View style={styles.milestoneRewardBadge}>
                <ThemedText style={styles.milestoneRewardText}>
                  +{milestone.reward}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Total Earnings Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <IconSymbol size={24} name="bitcoinsign.circle.fill" color="#F5A623" />
            <View style={styles.summaryDetails}>
              <ThemedText style={styles.summaryValue}>
                {totalEarnings.coinsFromStreaks}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>
                Total Coins from Streaks
              </ThemedText>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <IconSymbol size={24} name="calendar.badge.checkmark" color="#4CAF50" />
            <View style={styles.summaryDetails}>
              <ThemedText style={styles.summaryValue}>
                {totalEarnings.activeDays}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>
                Total Active Days
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  currentProgress: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    color: '#333',
  },
  streakBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  nextMilestoneCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  milestoneReward: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '500',
  },
  remainingDays: {
    alignItems: 'center',
  },
  remainingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A86E8',
    marginBottom: 2,
  },
  remainingLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A86E8',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  achievementReward: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  upcomingSection: {
    marginBottom: 24,
  },
  milestonesList: {
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  milestoneItemIcon: {
    fontSize: 24,
  },
  milestoneDetails: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  milestoneTarget: {
    fontSize: 12,
    color: '#666',
  },
  milestoneRewardBadge: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  milestoneRewardText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  summarySection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  summaryCard: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
}); 
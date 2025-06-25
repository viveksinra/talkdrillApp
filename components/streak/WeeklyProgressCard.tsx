import React from 'react';
import { View, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface WeeklyProgressCardProps {
  weekStart: string;
  weekEnd: string;
  streakData: {
    weekStartStreak: number;
    weekEndStreak: number;
    daysActiveThisWeek: number;
    activitiesCompleted: Array<{
      date: string;
      activity: string;
    }>;
  };
  sessionStats: {
    totalSessions: number;
    aiSessions: number;
    peerSessions: number;
    totalDuration: number;
    averageSessionDuration: number;
  };
  achievements: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
  progressMetrics: {
    improvementPercentage: number;
    consistencyScore: number;
    engagementScore: number;
  };
  badgeData: {
    shareableText: string;
    socialMediaText: string;
  };
  shareData: {
    isShared: boolean;
    shareRewardClaimed: boolean;
  };
  onShare?: () => void;
  onViewDetails?: () => void;
}

export default function WeeklyProgressCard({
  weekStart,
  weekEnd,
  streakData,
  sessionStats,
  achievements,
  progressMetrics,
  badgeData,
  shareData,
  onShare,
  onViewDetails
}: WeeklyProgressCardProps) {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: badgeData.shareableText,
        title: 'My Weekly English Practice Progress'
      });
      onShare?.();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#F5A623';
    return '#FF6B35';
  };

  return (
    <ThemedView style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dateRange}>
          <ThemedText type="defaultSemiBold" style={styles.weekTitle}>
            Weekly Report
          </ThemedText>
          <ThemedText style={styles.dateText}>
            {formatDate(weekStart)} - {formatDate(weekEnd)}
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <IconSymbol size={20} name="square.and.arrow.up" color="#4A86E8" />
          </TouchableOpacity>
          {!shareData.shareRewardClaimed && shareData.isShared && (
            <View style={styles.rewardBadge}>
              <ThemedText style={styles.rewardText}>+5</ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Streak Progress */}
      <View style={styles.streakSection}>
        <View style={styles.streakStats}>
          <View style={styles.streakStat}>
            <ThemedText style={styles.streakNumber}>
              {streakData.weekEndStreak}
            </ThemedText>
            <ThemedText style={styles.streakLabel}>Current Streak</ThemedText>
          </View>
          <View style={styles.streakStat}>
            <ThemedText style={styles.streakNumber}>
              {streakData.daysActiveThisWeek}
            </ThemedText>
            <ThemedText style={styles.streakLabel}>Days Active</ThemedText>
          </View>
          <View style={styles.streakStat}>
            <ThemedText style={styles.streakNumber}>
              {sessionStats.totalSessions}
            </ThemedText>
            <ThemedText style={styles.streakLabel}>Sessions</ThemedText>
          </View>
        </View>
      </View>

      {/* Progress Metrics */}
      <View style={styles.metricsSection}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Progress Metrics
        </ThemedText>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <View style={styles.metricHeader}>
              <ThemedText style={styles.metricLabel}>Consistency</ThemedText>
              <ThemedText style={[
                styles.metricValue,
                { color: getScoreColor(progressMetrics.consistencyScore) }
              ]}>
                {progressMetrics.consistencyScore}%
              </ThemedText>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${progressMetrics.consistencyScore}%`,
                    backgroundColor: getScoreColor(progressMetrics.consistencyScore)
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.metric}>
            <View style={styles.metricHeader}>
              <ThemedText style={styles.metricLabel}>Engagement</ThemedText>
              <ThemedText style={[
                styles.metricValue,
                { color: getScoreColor(progressMetrics.engagementScore) }
              ]}>
                {progressMetrics.engagementScore}%
              </ThemedText>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${progressMetrics.engagementScore}%`,
                    backgroundColor: getScoreColor(progressMetrics.engagementScore)
                  }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>

      {/* Session Breakdown */}
      <View style={styles.sessionSection}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Session Summary
        </ThemedText>
        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <IconSymbol size={20} name="message.fill" color="#4A86E8" />
            <ThemedText style={styles.sessionStatText}>
              {sessionStats.aiSessions} AI Sessions
            </ThemedText>
          </View>
          <View style={styles.sessionStat}>
            <IconSymbol size={20} name="person.2.fill" color="#34C759" />
            <ThemedText style={styles.sessionStatText}>
              {sessionStats.peerSessions} Peer Sessions
            </ThemedText>
          </View>
          <View style={styles.sessionStat}>
            <IconSymbol size={20} name="clock.fill" color="#F5A623" />
            <ThemedText style={styles.sessionStatText}>
              {formatDuration(sessionStats.totalDuration)} Total
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Achievements */}
      {achievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Achievements
          </ThemedText>
          <View style={styles.achievements}>
            {achievements.map((achievement, index) => (
              <View key={index} style={styles.achievement}>
                <ThemedText style={styles.achievementIcon}>
                  {achievement.icon}
                </ThemedText>
                <View style={styles.achievementInfo}>
                  <ThemedText style={styles.achievementName}>
                    {achievement.name}
                  </ThemedText>
                  <ThemedText style={styles.achievementDescription}>
                    {achievement.description}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {onViewDetails && (
          <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
            <ThemedText style={styles.detailsButtonText}>View Details</ThemedText>
            <IconSymbol size={16} name="chevron.right" color="#4A86E8" />
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dateRange: {
    flex: 1,
  },
  weekTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  rewardBadge: {
    backgroundColor: '#F5A623',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rewardText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  streakSection: {
    marginBottom: 20,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  streakStat: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  metricsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  metrics: {
    gap: 12,
  },
  metric: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sessionSection: {
    marginBottom: 20,
  },
  sessionStats: {
    gap: 12,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionStatText: {
    fontSize: 14,
    color: '#666',
  },
  achievementsSection: {
    marginBottom: 20,
  },
  achievements: {
    gap: 12,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#4A86E8',
    fontWeight: '500',
  },
}); 
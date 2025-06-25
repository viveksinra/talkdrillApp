import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  View
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import WeeklyProgressCard from '@/components/streak/WeeklyProgressCard';
import { 
  getWeeklyReports, 
  shareWeeklyReport,
  type WeeklyReport 
} from '@/api/services/streakService';

export default function WeeklyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load weekly reports
  const loadReports = useCallback(async () => {
    try {
      const weeklyReports = await getWeeklyReports();
      setReports(weeklyReports);
    } catch (error) {
      console.error('Error loading weekly reports:', error);
      Alert.alert('Error', 'Failed to load weekly reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, [loadReports]);

  const handleShare = async (reportId: string) => {
    try {
      const result = await shareWeeklyReport(reportId);
      
      if (result.success) {
        Alert.alert(
          'Shared Successfully!',
          result.shareRewardClaimed 
            ? `You earned ${result.shareReward} coins for sharing your progress!`
            : 'Your weekly progress has been shared.',
          [{ text: 'OK' }]
        );
        
        // Refresh reports to update share status
        loadReports();
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Failed to share report. Please try again.');
    }
  };

  const handleViewDetails = (report: WeeklyReport) => {
    Alert.alert(
      'Weekly Report Details',
      `Week: ${new Date(report.weekStart).toLocaleDateString()} - ${new Date(report.weekEnd).toLocaleDateString()}\n\n` +
      `Streak Progress: ${report.streakData.weekStartStreak} → ${report.streakData.weekEndStreak} days\n` +
      `Active Days: ${report.streakData.daysActiveThisWeek}/7\n` +
      `Total Sessions: ${report.sessionStats.totalSessions}\n` +
      `Total Time: ${Math.round(report.sessionStats.totalDuration / 60)} minutes\n` +
      `Achievements: ${report.achievements.length}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Weekly Reports',
            headerBackTitle: 'Back',
          }}
        />
        <ActivityIndicator size="large" color="#4A86E8" />
        <ThemedText style={styles.loadingText}>Loading reports...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Weekly Reports',
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
        {/* Header */}
        <ThemedView style={styles.headerCard}>
          <View style={styles.headerContent}>
            <IconSymbol size={32} name="chart.bar.fill" color="#4A86E8" />
            <View style={styles.headerText}>
              <ThemedText type="title" style={styles.headerTitle}>
                Weekly Progress Reports
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Track your learning journey and share your achievements
              </ThemedText>
            </View>
          </View>
          
          {reports.length > 0 && (
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryValue}>{reports.length}</ThemedText>
                <ThemedText style={styles.summaryLabel}>Reports</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryValue}>
                  {reports.filter(r => r.shareData.isShared).length}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Shared</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryValue}>
                  {reports.reduce((sum, r) => sum + r.achievements.length, 0)}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Achievements</ThemedText>
              </View>
            </View>
          )}
        </ThemedView>

        {/* Reports List */}
        {reports.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol size={64} name="chart.bar" color="#CCC" />
            <ThemedText style={styles.emptyTitle}>No Reports Yet</ThemedText>
            <ThemedText style={styles.emptyMessage}>
              Weekly reports are generated automatically when you maintain a 7+ day streak.
              Keep practicing to see your first report!
            </ThemedText>
          </ThemedView>
        ) : (
          <View style={styles.reportsList}>
            {reports.map((report) => (
              <WeeklyProgressCard
                key={report._id}
                weekStart={report.weekStart}
                weekEnd={report.weekEnd}
                streakData={report.streakData}
                sessionStats={report.sessionStats}
                achievements={report.achievements}
                progressMetrics={report.progressMetrics}
                badgeData={report.badgeData}
                shareData={report.shareData}
                onShare={() => handleShare(report._id)}
                onViewDetails={() => handleViewDetails(report)}
              />
            ))}
          </View>
        )}

        {/* Tips Card */}
        <ThemedView style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <IconSymbol size={24} name="lightbulb.fill" color="#F5A623" />
            <ThemedText type="defaultSemiBold" style={styles.tipsTitle}>
              Pro Tips
            </ThemedText>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <ThemedText style={styles.tipIcon}>🎯</ThemedText>
              <ThemedText style={styles.tipText}>
                Maintain a 7+ day streak to generate weekly reports
              </ThemedText>
            </View>
            <View style={styles.tipItem}>
              <ThemedText style={styles.tipIcon}>🎁</ThemedText>
              <ThemedText style={styles.tipText}>
                Share your reports to earn +5 bonus coins each time
              </ThemedText>
            </View>
            <View style={styles.tipItem}>
              <ThemedText style={styles.tipIcon}>📈</ThemedText>
              <ThemedText style={styles.tipText}>
                Track your consistency and engagement scores to improve
              </ThemedText>
            </View>
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
    color: '#666',
  },
  headerCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A86E8',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  reportsList: {
    gap: 0, // Gap is handled by the component itself
  },
  tipsCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 
import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getUserReports } from '@/api/services/reportService';
import { ReportItem } from '@/types';



export default function SavedReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await getUserReports(pageNum, 10, false); // Get all reports, not just saved ones
      
      if (response.variant === 'success' && response.myData) {
        const newReports = response.myData.reports || [];
        
        if (pageNum === 1 || refresh) {
          setReports(newReports);
        } else {
          setReports(prev => [...prev, ...newReports]);
        }
        
        setHasMore(pageNum < (response.myData.pages || 1));
        setPage(pageNum);
      } else {
        Alert.alert('Error', response.message || 'Failed to load reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchReports(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchReports(page + 1);
    }
  };
  
  const handleOpenReport = (reportId: string) => {
    router.push({
      pathname: '/report-detailed',
      params: { id: reportId }
    });
  };
  
  const getSessionTypeIcon = (goal: string) => {
    switch (goal?.toLowerCase()) {
      case 'business':
        return <IconSymbol size={24} name="briefcase.fill" color="#4A86E8" />;
      case 'academic':
        return <IconSymbol size={24} name="graduationcap.fill" color="#F5A623" />;
      case 'casual':
        return <IconSymbol size={24} name="bubble.left.and.bubble.right.fill" color="#34A853" />;
      default:
        return <IconSymbol size={24} name="doc.text.fill" color="#4A86E8" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPartnerName = (participants: Array<{ name: string; role: string }>) => {
    const partner = participants?.find(p => p.role === 'ai');
    return partner?.name || 'AI Assistant';
  };
  
  const renderReportItem = ({ item }: { item: ReportItem }) => (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => handleOpenReport(item.id)}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIcon}>
        <IconSymbol size={24} name="doc.text.fill" color="#4A86E8" />
        </View>
        <View style={styles.headerInfo}>
          <ThemedText type="defaultSemiBold" style={styles.partnerName}>
            Conversation with {getPartnerName(item.conversationOverview?.participants)}
          </ThemedText>
          <ThemedText style={styles.dateText}>
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>
        {item.isSaved && (
          <IconSymbol size={20} name="bookmark.fill" color="#F5A623" />
        )}
      </View>
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <ThemedText style={styles.scoreText}>{item.overallScore}/10</ThemedText>
        </View>
        <ThemedText type="defaultSemiBold">Overall Score</ThemedText>
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <ThemedText style={styles.metricLabel}>Fluency</ThemedText>
          <ThemedText style={styles.metricScore}>
            {item.metrics?.fluencyCoherence?.score || 0}/10
          </ThemedText>
        </View>
        <View style={styles.metricItem}>
          <ThemedText style={styles.metricLabel}>Grammar</ThemedText>
          <ThemedText style={styles.metricScore}>
            {item.metrics?.grammarAccuracy?.score || 0}/10
          </ThemedText>
        </View>
        <View style={styles.metricItem}>
          <ThemedText style={styles.metricLabel}>Vocab</ThemedText>
          <ThemedText style={styles.metricScore}>
            {item.metrics?.vocabularyRange?.score || 0}/10
          </ThemedText>
        </View>
        <View style={styles.metricItem}>
          <ThemedText style={styles.metricLabel}>Pronun.</ThemedText>
          <ThemedText style={styles.metricScore}>
            {item.metrics?.pronunciationIntelligibility?.score || 0}/10
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.viewButtonContainer}>
        <ThemedText style={styles.viewButtonText}>View Full Report</ThemedText>
        <IconSymbol size={16} name="chevron.right" color="#4A86E8" />
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4A86E8" />
      </View>
    );
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'All Reports',
        }}
      />
      <ThemedView style={styles.container}>
        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A86E8" />
            <ThemedText style={styles.loadingText}>Loading reports...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReportItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#4A86E8"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <IconSymbol size={48} name="doc.text" color="#888" />
                <ThemedText style={styles.emptyText}>No reports yet</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Complete conversations to generate reports
                </ThemedText>
              </View>
            }
          />
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#888',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    marginBottom: 2,
  },
  dateText: {
    color: '#888',
    fontSize: 14,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#4A86E8',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A86E8',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricScore: {
    fontWeight: '500',
    fontSize: 14,
  },
  viewButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  viewButtonText: {
    color: '#4A86E8',
    marginRight: 4,
    fontWeight: '500',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
    fontSize: 18,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
  },
}); 
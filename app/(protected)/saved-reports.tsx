import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Report } from '@/types';

export default function SavedReportsScreen() {
  const router = useRouter();
  
  // Mock saved reports data
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      sessionId: 'session1',
      sessionType: 'ai-chat',
      generatedDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      proficiencyScore: 78,
      metrics: {
        fluency: 80,
        grammar: 75,
        vocabulary: 85,
        pronunciation: 72
      },
      transcript: [],
      suggestions: [
        'Practice more past tense verb forms.',
        'Try to use more varied vocabulary when describing experiences.',
        'Work on the pronunciation of "th" sounds.'
      ]
    },
    {
      id: '2',
      sessionId: 'session2',
      sessionType: 'peer-call',
      generatedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      proficiencyScore: 85,
      metrics: {
        fluency: 88,
        grammar: 80,
        vocabulary: 90,
        pronunciation: 82
      },
      transcript: [],
      suggestions: [
        'Practice conditional sentences (if clauses).',
        'Continue improving pronunciation of longer words.',
        'Try using more idiomatic expressions.'
      ]
    }
  ]);
  
  const handleOpenReport = (reportId: string) => {
    router.push({
      pathname: '/report-detailed',
      params: { reportId }
    });
  };
  
  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'ai-chat':
        return <IconSymbol size={24} name="message.fill" color="#4A86E8" />;
      case 'ai-call':
        return <IconSymbol size={24} name="phone.fill" color="#4A86E8" />;
      case 'peer-chat':
        return <IconSymbol size={24} name="bubble.left.and.bubble.right.fill" color="#F5A623" />;
      case 'peer-call':
        return <IconSymbol size={24} name="person.wave.2.fill" color="#F5A623" />;
      default:
        return <IconSymbol size={24} name="doc.text.fill" color="#4A86E8" />;
    }
  };
  
  const formatDate = (date: Date) => {
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
  
  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => handleOpenReport(item.id)}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIcon}>
          {getSessionTypeIcon(item.sessionType)}
        </View>
        <ThemedText style={styles.dateText}>{formatDate(item.generatedDate)}</ThemedText>
      </View>
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <ThemedText style={styles.scoreText}>{item.proficiencyScore}</ThemedText>
        </View>
        <ThemedText type="defaultSemiBold">Proficiency Score</ThemedText>
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <ThemedText>Fluency</ThemedText>
          <ThemedText style={styles.metricScore}>{item.metrics.fluency}</ThemedText>
        </View>
        <View style={styles.metricItem}>
          <ThemedText>Grammar</ThemedText>
          <ThemedText style={styles.metricScore}>{item.metrics.grammar}</ThemedText>
        </View>
        <View style={styles.metricItem}>
          <ThemedText>Vocab</ThemedText>
          <ThemedText style={styles.metricScore}>{item.metrics.vocabulary}</ThemedText>
        </View>
        <View style={styles.metricItem}>
          <ThemedText>Pronun.</ThemedText>
          <ThemedText style={styles.metricScore}>{item.metrics.pronunciation}</ThemedText>
        </View>
      </View>
      
      <View style={styles.viewButtonContainer}>
        <ThemedText style={styles.viewButtonText}>View Full Report</ThemedText>
        <IconSymbol size={16} name="chevron.right" color="#4A86E8" />
      </View>
    </TouchableOpacity>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Saved Reports',
        }}
      />
      <ThemedView style={styles.container}>
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="doc.text" color="#888" />
              <ThemedText style={styles.emptyText}>No saved reports yet</ThemedText>
            </View>
          }
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: 'space-between',
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
  },
  dateText: {
    color: '#888',
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
    fontSize: 20,
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
  },
  metricScore: {
    fontWeight: '500',
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
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
  },
}); 
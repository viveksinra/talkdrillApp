import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import {generateReport} from '@/api/services/reportService';

// Import existing report components from AI call flow
import { ConversationOverview } from '@/components/report/ConversationOverview';
import { DetailedAnalysis } from '@/components/report/DetailedAnalysis';

export default function ReportDetailsScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    try {
      const reportData = await generateReport(sessionId as string);
      setReport(reportData);
    } catch (error) {
      console.error('Error loading report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <div style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading report...</ThemedText>
        </div>
      </ThemedView>
    );
  }

  if (error || !report) {
    return (
      <ThemedView style={styles.container}>
        <div style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {error || 'Report not found'}
          </ThemedText>
        </div>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ConversationOverview overview={report.conversationOverview} />
      <DetailedAnalysis analysis={report.detailedAnalysis} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
  },
}); 
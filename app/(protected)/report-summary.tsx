import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Report } from '@/types';
import React from 'react';
import { getReportById } from '@/api/services/reportService';

export default function ReportSummaryScreen() {
  const router = useRouter();
  const { type, reportId } = useLocalSearchParams();
  
  const [report, setReport] = useState<Report | null>(null);
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!reportId) return;
        
        const response = await getReportById(reportId as string);
        
        if (response.variant === 'success' && response.myData) {
          const reportData = response.myData.report || response.myData;
          
          // Transform the detailed report data to match the Report interface
          setReport({
            id: reportData.id,
            sessionId: reportData.conversationOverview?.conversationId || 'unknown',
            sessionType: type as any,
            generatedDate: new Date(reportData.createdAt),
            proficiencyScore: reportData.overallScore,
            metrics: {
              fluency: reportData.metrics?.fluencyCoherence?.score || 0,
              grammar: reportData.metrics?.grammarAccuracy?.score || 0,
              vocabulary: reportData.metrics?.vocabularyRange?.score || 0,
              pronunciation: reportData.metrics?.pronunciationIntelligibility?.score || 0
            },
            transcript: reportData.transcript || [],
            suggestions: reportData.suggestions || []
          });
        } else {
          Alert.alert('Error', 'Failed to load report');
        }
      } catch (error) {
        console.error('Error fetching report:', error);
        Alert.alert('Error', 'Failed to load report');
      }
    };

    fetchReport();
  }, [reportId]);
  
  const handleViewDetailed = () => {
    router.push({
      pathname: '/report-detailed',
      params: { reportId }
    });
  };
  
  const handleGoHome = () => {
    router.replace('/(protected)/(tabs)');
  };
  
  if (!report) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading report...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Conversation Report',
          headerLeft: () => null, // Disable back button to prevent going back to the loading screen
        }}
      />
      <ThemedView style={styles.container}>
        <ThemedView style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <ThemedText type="title" style={styles.scoreText}>{report.proficiencyScore}</ThemedText>
          </View>
          <ThemedText type="subtitle">Overall Proficiency Score</ThemedText>
          <ThemedText>
            {report.proficiencyScore > 80 ? 'Excellent!' : 
             report.proficiencyScore > 60 ? 'Good progress!' : 'Keep practicing!'}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.metricsContainer}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <ThemedText type="defaultSemiBold">Fluency</ThemedText>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricFill, 
                    { width: `${report.metrics.fluency}%` },
                    styles.fluencyColor
                  ]} 
                />
              </View>
              <ThemedText>{report.metrics.fluency}/10</ThemedText>
            </View>
            
            <View style={styles.metricItem}>
              <ThemedText type="defaultSemiBold">Grammar</ThemedText>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricFill, 
                    { width: `${report.metrics.grammar}%` },
                    styles.grammarColor
                  ]} 
                />
              </View>
              <ThemedText>{report.metrics.grammar}/10</ThemedText>
            </View>
          </View>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <ThemedText type="defaultSemiBold">Vocabulary</ThemedText>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricFill, 
                    { width: `${report.metrics.vocabulary}%` },
                    styles.vocabularyColor
                  ]} 
                />
              </View>
              <ThemedText>{report.metrics.vocabulary}/10</ThemedText>
            </View>
            
            <View style={styles.metricItem}>
              <ThemedText type="defaultSemiBold">Pronunciation</ThemedText>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricFill, 
                    { width: `${report.metrics.pronunciation}%` },
                    styles.pronunciationColor
                  ]} 
                />
              </View>
              <ThemedText>{report.metrics.pronunciation}/10</ThemedText>
            </View>
          </View>
        </ThemedView>
        
        <TouchableOpacity
          style={styles.detailedButton}
          onPress={handleViewDetailed}>
          <ThemedText style={styles.detailedButtonText}>View Detailed Feedback</ThemedText>
          <IconSymbol size={20} name="chevron.right" color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}>
          <ThemedText style={styles.homeButtonText}>Go to Home</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#4A86E8',
  },
  scoreText: {
    fontSize: 36,
    color: '#4A86E8',
  },
  metricsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  metricBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 4,
  },
  fluencyColor: {
    backgroundColor: '#4A86E8',
  },
  grammarColor: {
    backgroundColor: '#F5A623',
  },
  vocabularyColor: {
    backgroundColor: '#4CD964',
  },
  pronunciationColor: {
    backgroundColor: '#FF3B30',
  },
  detailedButton: {
    backgroundColor: '#4A86E8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailedButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
  homeButton: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  homeButtonText: {
    fontWeight: '600',
  },
}); 
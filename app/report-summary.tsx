import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Report } from '@/types';

export default function ReportSummaryScreen() {
  const router = useRouter();
  const { type, reportId } = useLocalSearchParams();
  
  const [report, setReport] = useState<Report | null>(null);
  
  useEffect(() => {
    // Mock fetching report data
    setReport({
      id: reportId as string,
      sessionId: '1',
      sessionType: type as any,
      generatedDate: new Date(),
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
    });
  }, [reportId]);
  
  const handleViewDetailed = () => {
    router.push({
      pathname: '/report-detailed',
      params: { reportId }
    });
  };
  
  const handleGoHome = () => {
    router.replace('/(tabs)');
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
              <ThemedText>{report.metrics.fluency}/100</ThemedText>
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
              <ThemedText>{report.metrics.grammar}/100</ThemedText>
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
              <ThemedText>{report.metrics.vocabulary}/100</ThemedText>
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
              <ThemedText>{report.metrics.pronunciation}/100</ThemedText>
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
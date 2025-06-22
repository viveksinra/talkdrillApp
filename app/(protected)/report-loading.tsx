import { StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { generateReportFromConversation } from '@/api/services/reportService';
import React from 'react';

export default function ReportLoadingScreen() {
  const router = useRouter();
  const { type, conversationId } = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const generateReport = async () => {
      try {
        if (type === 'ai-conversation' && conversationId) {
          console.log("Generating report for conversation:", conversationId);
          
          const result = await generateReportFromConversation(conversationId as string);
          
          if (result.variant === 'success' && result.myData?.reportId) {
            // Navigate to report summary with the generated report ID
            router.replace({
              pathname: '/report-summary',
              params: { 
                type, 
                reportId: result.myData.reportId,
                conversationId 
              }
            });
          } else if (result.variant === 'info' && result.myData?.reportId) {
            // Report already exists, navigate to it
            router.replace({
              pathname: '/report-summary',
              params: { 
                type, 
                reportId: result.myData.reportId,
                conversationId 
              }
            });
          } else {
            setError('Failed to generate report. Please try again.');
          }
        } else {
          // Mock report generation for other types
          const timer = setTimeout(() => {
            router.replace({
              pathname: '/report-summary',
              params: { type, reportId: '1' }
            });
          }, 3000);
          
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error("Error generating report:", error);
        setError('Failed to generate report. Please try again.');
      }
    };

    generateReport();
  }, [type, conversationId]);

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <ThemedView style={styles.container}>
          <ThemedText type="subtitle" style={styles.errorTitle}>Report Generation Failed</ThemedText>
          <ThemedText style={styles.description}>{error}</ThemedText>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => router.back()}
          >
            <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#4A86E8" />
        <ThemedText type="subtitle" style={styles.title}>Generating your report...</ThemedText>
        <ThemedText style={styles.description}>
          Our AI is analyzing your conversation to provide personalized feedback.
        </ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ECF3FF',
  },
  title: {
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: '80%',
  },
  errorTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#F44336',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4A86E8',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
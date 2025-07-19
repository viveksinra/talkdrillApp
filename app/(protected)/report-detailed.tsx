import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, View, Linking } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import report components
import { ConversationOverview } from '@/components/report/ConversationOverview';
import { Scorecard } from '@/components/report/ScoreCard';
import { DetailedAnalysis } from '@/components/report/DetailedAnalysis';
import { StrengthsImprovements } from '@/components/report/StrengthsImprovements';
import { ActionPlan } from '@/components/report/ActionPlan';
import { Visuals } from '@/components/report/Visuals';
import { ExportOptions } from '@/components/report/ExportOptions';

import { DetailedReport } from '@/types';
import { 
  getReportById, 
  toggleSaveReport, 
  exportReportAsPDF, 
  exportReportAsCSV, 
  generateShareLink, 
  scheduleFollowUp 
} from '@/api/services/reportService';

export default function ReportDetailedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      
      // Use the proper report service to fetch data
      const response = await getReportById(id as string);
      
      if (response.variant === 'success' && response.myData) {
        setReport(response.myData.report || response.myData); // Handle both response formats
        setIsSaved(response.myData.report?.isSaved || response.myData.isSaved || false);
      } else {
        // If API fails, show error instead of falling back to mock
        Alert.alert('Error', response.message || 'Failed to load report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      Alert.alert('Error', 'Failed to load report. Please try again.');
    } finally {
      setLoading(false); // Always set loading to false
    }
  };

  const handleSaveToggle = async () => {
    if (!report) return;

    try {
      const response = await toggleSaveReport(report.id);
      
      if (response.variant === 'success') {
        setIsSaved(!isSaved);
        Alert.alert('Success', response.message);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      Alert.alert('Error', 'Failed to update report. Please try again.');
    }
  };

  const handleExportPDF = async (reportId: string) => {
    try {
      const response = await exportReportAsPDF(reportId);
      
      if (response.variant === 'success') {
        const { downloadUrl, fileName } = response.myData;
        
        Alert.alert(
          'PDF Export Ready',
          `Your report "${fileName}" has been generated successfully.`,
          [
            { 
              text: 'Download', 
              onPress: async () => {
                try {
                  // Construct full URL if it's a relative path
                  const fullUrl = downloadUrl.startsWith('http') 
                    ? downloadUrl 
                    : `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:2040'}${downloadUrl}`;
                  
                  await Linking.openURL(fullUrl);
                } catch (error) {
                  console.error('Error opening download URL:', error);
                  Alert.alert('Error', 'Failed to open download link.');
                }
              }
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
      throw error;
    }
  };

  const handleExportCSV = async (reportId: string) => {
    try {
      const response = await exportReportAsCSV(reportId);
      
      if (response.variant === 'success') {
        const { downloadUrl, fileName } = response.myData;
        
        Alert.alert(
          'CSV Export Ready',
          `Your data file "${fileName}" has been generated successfully.`,
          [
            { 
              text: 'Download', 
              onPress: async () => {
                try {
                  // Construct full URL if it's a relative path
                  const fullUrl = downloadUrl.startsWith('http') 
                    ? downloadUrl 
                    : `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:2040'}${downloadUrl}`;
                  
                  await Linking.openURL(fullUrl);
                } catch (error) {
                  console.error('Error opening download URL:', error);
                  Alert.alert('Error', 'Failed to open download link.');
                }
              }
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export CSV. Please try again.');
      throw error;
    }
  };

  const handleGenerateShareLink = async (reportId: string) => {
    try {
      const response = await generateShareLink(reportId);
      
      if (response.variant === 'success') {
        Alert.alert(
          'Share Link Generated',
          response.message,
          [
            { text: 'Copy Link', onPress: () => console.log('Link copied') },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      Alert.alert('Error', 'Failed to generate share link. Please try again.');
      throw error;
    }
  };

  const handleScheduleFollowUp = async (reportId: string) => {
    try {
      const followUpData = {
        type: 'notification' as const,
        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        message: 'Time to review your English speaking progress!'
      };
      
      const response = await scheduleFollowUp(reportId, followUpData);
      
      if (response.variant === 'success') {
        Alert.alert(
          'Follow-up Scheduled',
          response.message,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      Alert.alert('Error', 'Failed to schedule follow-up. Please try again.');
      throw error;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A86E8" />
          <ThemedText style={styles.loadingText}>Loading detailed report...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol size={48} name="exclamationmark.triangle" color="#666" />
          <ThemedText style={styles.errorText}>Report not found</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <Stack.Screen options={{ headerShown: true, title: 'Detailed Report', headerTitleAlign: 'center' }} />
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol size={24} name="arrow.left" color="#333" />
        </TouchableOpacity>
        
        <ThemedText style={styles.headerTitle}>Detailed Report</ThemedText>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveToggle}>
          <IconSymbol 
            size={24} 
            name={isSaved ? "bookmark.fill" : "bookmark"} 
            color={isSaved ? "#4A86E8" : "#666"} 
          />
        </TouchableOpacity>
      </View> */}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Conversation Overview */}
          <ConversationOverview overview={report.conversationOverview} />
          
          {/* Scorecard */}
          <Scorecard overallScore={report.overallScore} metrics={report.metrics} />
          
          {/* Detailed Analysis */}
          <DetailedAnalysis metrics={report.metrics} />
          
          {/* Strengths & Improvements */}
          <StrengthsImprovements 
            strengths={report.strengths} 
            improvements={report.improvements} 
          />
          
          {/* Action Plan */}
          <ActionPlan actionPlan={report.actionPlan} />
          
          {/* Visuals */}
          {/* TODO implement chart with libraries */}
          {/* <Visuals visualsData={report.visualsData} /> */}
          
          {/* Export Options */}
          <ExportOptions
            reportId={report.id}
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
            onGenerateShareLink={handleGenerateShareLink}
            onScheduleFollowUp={handleScheduleFollowUp}
          />
          
          {/* Footer info */}
          {/* <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Report generated on {new Date(report.createdAt).toLocaleDateString()}
            </ThemedText>
            <ThemedText style={styles.footerText}>
              Session duration: {Math.round(report.conversationOverview.duration)} minutes
            </ThemedText>
          </View> */}
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A86E8',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
}); 
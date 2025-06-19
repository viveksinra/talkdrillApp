import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, View, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const [loading, setLoading] = useState(true);
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
        setReport(response.myData);
        setIsSaved(response.myData.isSaved || false);
        setLoading(false);
        return;
      }
      
      // Fallback to mock data for development/testing
      console.log('Using mock data for development');
      
      // Mock comprehensive report data matching our new structure
      const mockReport: DetailedReport = {
        id: id as string,
        sessionId: 'session-123',
        sessionType: 'ai-call',
        conversationOverview: {
          participants: [
            { name: 'Vivek', role: 'user' },
            { name: 'Meghanand', role: 'ai' }
          ],
          date: new Date(),
          duration: 25,
          scenario: 'Job Interview Preparation',
          excerpt: 'Vivek discussed his previous work experience and qualifications for a marketing position at a technology company.',
          goal: 'Business'
        },
        overallScore: 7,
        metrics: {
          fluencyCoherence: {
            score: 7,
            wordsPerMinute: 95,
            pausesPerMinute: 4,
            discourseMarkersUsed: 8,
            analysis: 'Vivek demonstrates good overall fluency with appropriate use of fillers and discourse markers like "actually," "you know," and "I mean." Occasional pauses occur when discussing technical topics.'
          },
          grammarAccuracy: {
            score: 6,
            errorTypes: ['Tenses', 'Articles'],
            errorsPerHundredWords: 4,
            transcriptExamples: [
              {
                original: 'I am working in this company for five years.',
                corrected: 'I have been working in this company for five years.'
              },
              {
                original: 'I completed MBA from prestigious university.',
                corrected: 'I completed an MBA from a prestigious university.'
              }
            ]
          },
          vocabularyRange: {
            score: 8,
            lexicalDiversity: 75,
            businessTerms: {
              used: ['quarterly results', 'stakeholders', 'ROI', 'deliverables'],
              missing: ['KPIs', 'synergy', 'scalability']
            }
          },
          pronunciationIntelligibility: {
            score: 7,
            phonemeLevelErrors: 12,
            intelligibilityRating: 88,
            commonChallenges: 'Common pronunciation challenges with /v/ vs /w/ sounds and word stress patterns in multisyllabic words.',
            problematicWords: [
              { word: 'development', issue: 'stress on second syllable instead of third' },
              { word: 'variety', issue: '/w/ sound instead of /v/' }
            ]
          },
          pragmaticsRegister: {
            politenessStrategies: 'Appropriate',
            formalityMatch: 85,
            turnTaking: 'Good',
            analysis: 'Vivek demonstrates appropriate business register with good use of formal expressions. Occasionally mixes casual phrases into formal context. Turn-taking is natural with appropriate back-channeling signals.'
          }
        },
        strengths: [
          {
            title: 'Clear articulation of ideas',
            description: 'Able to express complex thoughts in a structured manner'
          },
          {
            title: 'Strong business vocabulary',
            description: 'Uses appropriate industry terminology and business expressions'
          },
          {
            title: 'Effective listening skills',
            description: 'Responds appropriately to questions and maintains conversation flow'
          }
        ],
        improvements: [
          {
            title: 'Grammar consistency with tenses',
            description: 'Work on consistent use of perfect tenses in professional contexts',
            action: 'Daily grammar drills focusing on past perfect and present perfect tenses'
          },
          {
            title: 'Pronunciation of specific phonemes',
            description: 'Focus on /v/ vs /w/ distinction and word stress patterns',
            action: 'Targeted pronunciation exercises for /v/ vs /w/ sounds, record and review'
          },
          {
            title: 'Advanced business terminology',
            description: 'Expand vocabulary with specialized business terms',
            action: 'Learn 5 new business terms daily, practice in role-play scenarios'
          }
        ],
        actionPlan: {
          shortTerm: [
            {
              task: 'Reduce speech pauses by 30% through daily 5-minute fluency drills',
              timeframe: '1-2 weeks'
            },
            {
              task: 'Learn and practice 2 new business idioms daily from provided resource list',
              timeframe: '1-2 weeks'
            },
            {
              task: 'Complete 10 grammar exercises focusing on article usage and tense consistency',
              timeframe: '1-2 weeks'
            }
          ],
          midTerm: [
            {
              task: 'Prepare and deliver a 3-minute formal business presentation with less than 5 grammar errors',
              timeframe: '1-2 months'
            },
            {
              task: 'Reduce pronunciation error rate to below 5 errors per 100 words',
              timeframe: '1-2 months'
            },
            {
              task: 'Participate in 4 mock interview sessions with feedback focusing on pragmatic appropriateness',
              timeframe: '1-2 months'
            }
          ],
          resources: {
            apps: ['Talk Drill (pronunciation)', 'Grammarly (writing)', 'Business English by Cambridge'],
            podcasts: ['Business English Pod', 'HBR IdeaCast', 'The English We Speak (BBC)'],
            worksheets: ['Custom grammar exercises (shared via email)', 'Business vocabulary flashcards']
          }
        },
        visualsData: {
          errorRateOverTime: [
            { time: '0:00', errorRate: 8 },
            { time: '5:00', errorRate: 7 },
            { time: '10:00', errorRate: 9 },
            { time: '15:00', errorRate: 6 },
            { time: '20:00', errorRate: 8 },
            { time: '25:00', errorRate: 5 }
          ],
          skillProfile: [
            { skill: 'Grammar', current: 6, target: 9 },
            { skill: 'Vocabulary', current: 8, target: 9 },
            { skill: 'Fluency', current: 7, target: 9 },
            { skill: 'Pronunciation', current: 7, target: 8 },
            { skill: 'Pragmatics', current: 8, target: 9 }
          ],
          vocabularyComparison: [
            { level: 'Expert', current: 2, target: 8 },
            { level: 'Advanced', current: 5, target: 12 },
            { level: 'Intermediate', current: 8, target: 15 },
            { level: 'Basic', current: 12, target: 10 }
          ]
        },
        suggestions: [
          'Work on sentence structure and grammar consistency',
          'Practice speaking more fluently by reducing pauses',
          'Expand your vocabulary with more specialized business terms',
          'Focus on pronunciation accuracy for challenging sounds'
        ],
        isSaved: false,
        exports: [],
        createdAt: new Date()
      };

      setReport(mockReport);
      setIsSaved(mockReport.isSaved);
    } catch (error) {
      console.error('Error fetching report:', error);
      Alert.alert('Error', 'Failed to load report. Please try again.');
    } finally {
      setLoading(false);
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
      </View>

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
          
          {/* Export Options */}
          <ExportOptions
            reportId={report.id}
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
            onGenerateShareLink={handleGenerateShareLink}
            onScheduleFollowUp={handleScheduleFollowUp}
          />
          
          {/* Footer info */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Report generated on {new Date(report.createdAt).toLocaleDateString()}
            </ThemedText>
            <ThemedText style={styles.footerText}>
              Session duration: {Math.round(report.conversationOverview.duration)} minutes
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
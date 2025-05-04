import { StyleSheet, ScrollView, TouchableOpacity, View, Share } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Report, TranscriptItem } from '@/types';

export default function ReportDetailedScreen() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams();
  
  const [report, setReport] = useState<Report | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  useEffect(() => {
    // Mock fetching report data with transcript
    setReport({
      id: reportId as string,
      sessionId: '1',
      sessionType: 'ai-chat',
      generatedDate: new Date(),
      proficiencyScore: 78,
      metrics: {
        fluency: 80,
        grammar: 75,
        vocabulary: 85,
        pronunciation: 72
      },
      transcript: [
        {
          id: 'ai-1',
          speaker: 'ai',
          text: 'Hello! Can you tell me about your last vacation?',
          timestamp: new Date(Date.now() - 500000),
          errors: []
        },
        {
          id: 'user-1',
          speaker: 'user',
          text: 'I went to beach last month. It were very beautiful and I swim everyday.',
          timestamp: new Date(Date.now() - 400000),
          errors: [
            {
              start: 9,
              end: 14,
              type: 'grammar',
              suggestion: 'to the beach'
            },
            {
              start: 25,
              end: 29,
              type: 'grammar',
              suggestion: 'was'
            },
            {
              start: 44,
              end: 48,
              type: 'grammar',
              suggestion: 'swam'
            }
          ]
        },
        {
          id: 'ai-2',
          speaker: 'ai',
          text: 'That sounds nice! What was your favorite thing about the trip?',
          timestamp: new Date(Date.now() - 300000),
          errors: []
        },
        {
          id: 'user-2',
          speaker: 'user',
          text: 'I liked the food very much. I eated seafood every day. It was delicious.',
          timestamp: new Date(Date.now() - 200000),
          errors: [
            {
              start: 29,
              end: 34,
              type: 'grammar',
              suggestion: 'ate'
            }
          ]
        }
      ],
      suggestions: [
        'Practice more past tense verb forms.',
        'Try to use more varied vocabulary when describing experiences.',
        'Work on the pronunciation of "th" sounds.'
      ]
    });
  }, [reportId]);
  
  const handleSaveReport = () => {
    setIsSaved(!isSaved);
    // In a real app, save report to storage or server
  };
  
  const handleShareReport = async () => {
    try {
      await Share.share({
        message: 'Check out my language practice report from SpeakUp!',
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };
  
  const renderTranscriptItem = (item: TranscriptItem) => {
    if (item.errors && item.errors.length > 0) {
      let lastIndex = 0;
      const textParts = [];
      
      // Sort errors by start position
      const sortedErrors = [...item.errors].sort((a, b) => a.start - b.start);
      
      sortedErrors.forEach((error, i) => {
        // Add text before the error
        if (error.start > lastIndex) {
          textParts.push(
            <ThemedText key={`${item.id}-text-${i}`}>
              {item.text.substring(lastIndex, error.start)}
            </ThemedText>
          );
        }
        
        // Add the error text with highlighting
        textParts.push(
          <TouchableOpacity key={`${item.id}-error-${i}`}>
            <ThemedText style={[
              styles.errorText,
              error.type === 'grammar' ? styles.grammarError :
              error.type === 'vocabulary' ? styles.vocabularyError :
              styles.pronunciationError
            ]}>
              {item.text.substring(error.start, error.end)}
            </ThemedText>
          </TouchableOpacity>
        );
        
        lastIndex = error.end;
      });
      
      // Add any remaining text
      if (lastIndex < item.text.length) {
        textParts.push(
          <ThemedText key={`${item.id}-text-last`}>
            {item.text.substring(lastIndex)}
          </ThemedText>
        );
      }
      
      return (
        <View style={[
          styles.transcriptItem,
          item.speaker === 'user' ? styles.userTranscript : styles.aiTranscript
        ]}>
          <ThemedText type="defaultSemiBold">
            {item.speaker === 'user' ? 'You' : 'AI'}:
          </ThemedText>
          <View style={styles.transcriptTextContainer}>
            {textParts}
          </View>
          {item.errors.length > 0 && (
            <View style={styles.errorsList}>
              {item.errors.map((error, i) => (
                <View key={`correction-${i}`} style={styles.correction}>
                  <IconSymbol size={16} name="arrow.turn.up.right" color="#FF3B30" />
                  <ThemedText style={styles.correctionText}>
                    <ThemedText style={styles.correctionBold}>
                      {item.text.substring(error.start, error.end)}
                    </ThemedText>
                    {" → "}
                    <ThemedText style={styles.correctionBold}>
                      {error.suggestion}
                    </ThemedText>
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }
    
    return (
      <View style={[
        styles.transcriptItem,
        item.speaker === 'user' ? styles.userTranscript : styles.aiTranscript
      ]}>
        <ThemedText type="defaultSemiBold">
          {item.speaker === 'user' ? 'You' : 'AI'}:
        </ThemedText>
        <ThemedText>{item.text}</ThemedText>
      </View>
    );
  };
  
  if (!report) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading detailed report...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Detailed Feedback',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={handleSaveReport}>
                <IconSymbol 
                  size={24} 
                  name={isSaved ? "bookmark.fill" : "bookmark"} 
                  color={isSaved ? "#4A86E8" : "#000"} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareReport}>
                <IconSymbol size={24} name="square.and.arrow.up" color="#000" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Session Metrics</ThemedText>
          <View style={styles.metricsRow}>
            <View style={styles.metricBadge}>
              <ThemedText style={styles.metricScore}>{report.metrics.fluency}</ThemedText>
              <ThemedText style={styles.metricLabel}>Fluency</ThemedText>
            </View>
            <View style={styles.metricBadge}>
              <ThemedText style={styles.metricScore}>{report.metrics.grammar}</ThemedText>
              <ThemedText style={styles.metricLabel}>Grammar</ThemedText>
            </View>
            <View style={styles.metricBadge}>
              <ThemedText style={styles.metricScore}>{report.metrics.vocabulary}</ThemedText>
              <ThemedText style={styles.metricLabel}>Vocabulary</ThemedText>
            </View>
            <View style={styles.metricBadge}>
              <ThemedText style={styles.metricScore}>{report.metrics.pronunciation}</ThemedText>
              <ThemedText style={styles.metricLabel}>Pronunciation</ThemedText>
            </View>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Suggestions for Improvement</ThemedText>
          {report.suggestions.map((suggestion, index) => (
            <View key={`suggestion-${index}`} style={styles.suggestionItem}>
              <IconSymbol size={16} name="lightbulb.fill" color="#F5A623" />
              <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
            </View>
          ))}
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Conversation Transcript</ThemedText>
          <ThemedText style={styles.transcriptInfo}>
            Tap on highlighted errors to see corrections.
          </ThemedText>
          
          {report.transcript.map(item => (
            <View key={item.id}>
              {renderTranscriptItem(item)}
            </View>
          ))}
        </ThemedView>
      </ScrollView>
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
  },
  section: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metricBadge: {
    alignItems: 'center',
  },
  metricScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A86E8',
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    gap: 8,
  },
  suggestionText: {
    flex: 1,
  },
  transcriptInfo: {
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 12,
  },
  transcriptItem: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  userTranscript: {
    backgroundColor: '#ECF3FF',
  },
  aiTranscript: {
    backgroundColor: 'white',
  },
  transcriptTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  errorText: {
    textDecorationLine: 'underline',
  },
  grammarError: {
    color: '#FF3B30',
    textDecorationColor: '#FF3B30',
  },
  vocabularyError: {
    color: '#F5A623',
    textDecorationColor: '#F5A623',
  },
  pronunciationError: {
    color: '#4CD964',
    textDecorationColor: '#4CD964',
  },
  errorsList: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
  },
  correction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  correctionText: {
    marginLeft: 4,
    fontSize: 13,
  },
  correctionBold: {
    fontWeight: 'bold',
  },
}); 
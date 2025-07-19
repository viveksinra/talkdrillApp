import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DetailedMetrics } from '@/types';

interface Props {
  metrics: DetailedMetrics;
}

export const DetailedAnalysis: React.FC<Props> = ({ metrics }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle" style={styles.title}>Detailed Analysis</ThemedText>
        <View style={styles.iconContainer}>
          <IconSymbol 
            size={24} 
            name={isExpanded ? "chevron.up" : "chevron.down"} 
            color="#000" 
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Fluency & Coherence */}
          <View style={{marginBottom:20}}>
            <ThemedText style={styles.sectionTitle}>Fluency & Coherence</ThemedText>
            
            <View style={{backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16}}>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Words per minute</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.fluencyCoherence.wordsPerMinute} WPM</ThemedText>
              </View>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Pauses per minute</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.fluencyCoherence.pausesPerMinute}</ThemedText>
              </View>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Discourse markers used</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.fluencyCoherence.discourseMarkersUsed}</ThemedText>
              </View>
            </View>

            {/* <View style={styles.analysisContainer}> */}
              <ThemedText style={styles.analysisText}>
                {metrics.fluencyCoherence.analysis}
              </ThemedText>
            {/* </View> */}
          </View>

          {/* Grammar */}
          <View style={{marginBottom:20}}>
            <ThemedText style={styles.sectionTitle}>Grammar</ThemedText>
            
            <View style={{backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 16}}>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Error types</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.grammarAccuracy.errorTypes.join(', ')}</ThemedText>
              </View>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Errors per 100 words</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.grammarAccuracy.errorsPerHundredWords}</ThemedText>
              </View>
            </View>

            <View style={{backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16}}>
              <ThemedText style={styles.subSectionTitle}>Transcript examples & corrections</ThemedText>
              <View style={styles.transcriptExamplesWrapper}>
                {metrics.grammarAccuracy.transcriptExamples.map((example, index) => (
                  <View key={index} style={styles.transcriptExample}>
                    <ThemedText style={styles.originalText}>"{example.original}"</ThemedText>
                    <ThemedText style={styles.correctedText}>"{example.corrected}"</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Vocabulary */}
          <View style={{marginBottom:20}}>
            <ThemedText style={styles.sectionTitle}>Vocabulary</ThemedText>
            
            <View style={{backgroundColor: '#F8F9FA', borderRadius: 12, padding: 8, marginBottom:16}}>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Lexical diversity (MTLD)</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.vocabularyRange.lexicalDiversity}</ThemedText>
              </View>
            </View>

            {/* <View style={{backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16}}>
              <ThemedText style={styles.subSectionTitle}>Business goal: used vs. missing terms</ThemedText>
              
              <View style={styles.termsContainer}>
                {metrics.vocabularyRange.businessTerms.used.map((term, index) => (
                  <View key={index} style={[styles.termPill, styles.usedTerm]}>
                    <ThemedText style={styles.usedTermText}>{term}</ThemedText>
                  </View>
                ))}
                {metrics.vocabularyRange.businessTerms.missing.map((term, index) => (
                  <View key={index} style={[styles.termPill, styles.missingTerm]}>
                    <ThemedText style={styles.missingTermText}>{term}</ThemedText>
                  </View>
                ))}
              </View>
            </View> */}
          </View>

          {/* Pronunciation */}
          <View style={{marginBottom:20}}>
            <ThemedText style={styles.sectionTitle}>Pronunciation</ThemedText>
            
            <View style={{backgroundColor: '#F8F9FA', borderRadius: 12, padding: 8, marginBottom:16}}>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Phoneme-level errors</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pronunciationIntelligibility.phonemeLevelErrors}</ThemedText>
              </View>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Intelligibility rating</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pronunciationIntelligibility.intelligibilityRating}%</ThemedText>
              </View>
            </View>

            {/* <View >
              <ThemedText style={styles.analysisText}>
                {metrics.pronunciationIntelligibility.commonChallenges}
              </ThemedText>
            </View> */}

            <View style={styles.subsectionContainer}>
              <ThemedText style={styles.subSectionTitle}>Problematic words</ThemedText>
              <View style={styles.problematicWordsWrapper}>
                {metrics.pronunciationIntelligibility.problematicWords.length > 0 
                ?  metrics.pronunciationIntelligibility.problematicWords.map((word, index) => (
                  <View key={index} style={styles.problematicWordRow}>
                    <ThemedText style={styles.problematicWordText}>
                      <ThemedText style={styles.boldText}>{word.word}</ThemedText>
                      <ThemedText style={styles.arrowText}> → </ThemedText>
                      <ThemedText style={styles.issueText}>{word.issue}</ThemedText>
                    </ThemedText>
                  </View>
                ))
                : <ThemedText style={styles.analysisText}>No problematic words found</ThemedText>}
              </View>
            </View>
          </View>

          {/* Pragmatics & Register */}
          <View style={{marginBottom:20}}>
            <ThemedText style={styles.sectionTitle}>Pragmatics & Register</ThemedText>
              
            <View style={{backgroundColor: '#F8F9FA', borderRadius: 12, padding: 8, marginBottom:16}}>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Politeness strategies</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pragmaticsRegister.politenessStrategies}</ThemedText>
              </View>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Formality match</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pragmaticsRegister.formalityMatch}%</ThemedText>
              </View>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Turn-taking</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pragmaticsRegister.turnTaking}</ThemedText>
              </View>
            </View>

            <View >
              <ThemedText style={styles.analysisText}>
                {metrics.pragmaticsRegister.analysis}
              </ThemedText>
            </View>
          </View>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  iconContainer: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  section: {
    marginBottom: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A86E8',
    marginBottom: 16,
    letterSpacing: -0.1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  metricLabel: {
    fontSize: 14,
    color: '#4A4A4A',
    flex: 1,
    paddingRight: 16,
    fontWeight: '400',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  analysisContainer: {
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4A86E8',
  },
  analysisText: {
    fontSize: 14,
    color: '#5A5A5A',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  subsectionContainer: {
    marginTop: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  transcriptExamplesWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  transcriptExample: {
    marginBottom: 8,
  },
  originalText: {
    fontSize: 14,
    color: '#D32F2F',
    textDecorationLine: 'line-through',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  correctedText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  termPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  usedTerm: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  missingTerm: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  usedTermText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  missingTermText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
  },
  problematicWordsWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  problematicWordRow: {
    marginBottom: 6,
    paddingVertical: 2,
  },
  problematicWordText: {
    fontSize: 14,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  arrowText: {
    color: '#8A8A8A',
    fontWeight: '400',
  },
  issueText: {
    color: '#5A5A5A',
    fontStyle: 'italic',
  },
}); 
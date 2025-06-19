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
        <IconSymbol 
          size={20} 
          name={isExpanded ? "chevron.up" : "chevron.down"} 
          color="#666" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Fluency & Coherence */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Fluency & Coherence</ThemedText>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Words per minute</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.fluencyCoherence.wordsPerMinute} WPM</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Pauses per minute</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.fluencyCoherence.pausesPerMinute}</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Discourse markers used</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.fluencyCoherence.discourseMarkersUsed}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.analysisText}>
              {metrics.fluencyCoherence.analysis}
            </ThemedText>
          </View>

          {/* Grammar */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Grammar</ThemedText>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Error types</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.grammarAccuracy.errorTypes.join(', ')}</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Errors per 100 words</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.grammarAccuracy.errorsPerHundredWords}</ThemedText>
              </View>
            </View>

            <View style={styles.transcriptExamplesContainer}>
              <ThemedText style={styles.subSectionTitle}>Transcript examples & corrections</ThemedText>
              {metrics.grammarAccuracy.transcriptExamples.map((example, index) => (
                <View key={index} style={styles.transcriptExample}>
                  <ThemedText style={styles.originalText}>{example.original}</ThemedText>
                  <ThemedText style={styles.correctedText}>{example.corrected}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Vocabulary */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Vocabulary</ThemedText>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Lexical diversity (MTLD)</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.vocabularyRange.lexicalDiversity}</ThemedText>
              </View>
            </View>

            <View style={styles.businessTermsContainer}>
              <ThemedText style={styles.subSectionTitle}>Business goal: used vs. missing terms</ThemedText>
              
              <View style={styles.termsRow}>
                {metrics.vocabularyRange.businessTerms.used.map((term, index) => (
                  <View key={index} style={[styles.termPill, styles.usedTerm]}>
                    <ThemedText style={styles.usedTermText}>{term}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.termsRow}>
                {metrics.vocabularyRange.businessTerms.missing.map((term, index) => (
                  <View key={index} style={[styles.termPill, styles.missingTerm]}>
                    <ThemedText style={styles.missingTermText}>{term}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Pronunciation */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Pronunciation</ThemedText>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Phoneme-level errors</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pronunciationIntelligibility.phonemeLevelErrors}</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Intelligibility rating</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pronunciationIntelligibility.intelligibilityRating}%</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.analysisText}>
              {metrics.pronunciationIntelligibility.commonChallenges}
            </ThemedText>

            <View style={styles.problematicWordsContainer}>
              <ThemedText style={styles.subSectionTitle}>Problematic words</ThemedText>
              {metrics.pronunciationIntelligibility.problematicWords.map((word, index) => (
                <View key={index} style={styles.problematicWord}>
                  <ThemedText style={styles.problematicWordText}>
                    <ThemedText style={styles.boldText}>{word.word}</ThemedText>
                    {" → "}
                    {word.issue}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Pragmatics & Register */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Pragmatics & Register</ThemedText>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Politeness strategies</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pragmaticsRegister.politenessStrategies}</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Formality match</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pragmaticsRegister.formalityMatch}%</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Turn-taking</ThemedText>
                <ThemedText style={styles.metricValue}>{metrics.pragmaticsRegister.turnTaking}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.analysisText}>
              {metrics.pragmaticsRegister.analysis}
            </ThemedText>
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
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A86E8',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 16,
  },
  metricItem: {
    minWidth: '45%',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  analysisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  businessTermsContainer: {
    marginTop: 12,
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  termPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  usedTerm: {
    backgroundColor: '#E8F5E8',
  },
  missingTerm: {
    backgroundColor: '#FFEBEE',
  },
  usedTermText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  missingTermText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '500',
  },
  transcriptExamplesContainer: {
    marginTop: 12,
  },
  transcriptExample: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  originalText: {
    fontSize: 14,
    color: '#C62828',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  correctedText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  problematicWordsContainer: {
    marginTop: 12,
  },
  problematicWord: {
    marginBottom: 4,
  },
  problematicWordText: {
    fontSize: 14,
    color: '#666',
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
  },
}); 
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DetailedMetrics } from '@/types';

interface Props {
  overallScore: number;
  metrics: DetailedMetrics;
}

export const Scorecard: React.FC<Props> = ({ overallScore, metrics }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4CAF50'; // Green
    if (score >= 6) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getScoreBarWidth = (score: number) => {
    return `${(score / 10) * 100}%`;
  };

  const renderScoreBar = (label: string, score: number) => (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <ThemedText style={styles.scoreBarLabel}>{label}</ThemedText>
        <ThemedText style={[styles.scoreBarValue, { color: getScoreColor(score) }]}>
          {score}
        </ThemedText>
      </View>
      <View style={styles.scoreBarTrack}>
        <View 
          style={[
            styles.scoreBarFill, 
            { 
              width: getScoreBarWidth(score),
              backgroundColor: getScoreColor(score)
            }
          ]} 
        />
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle" style={styles.title}>Scorecard (0-10)</ThemedText>
        <IconSymbol 
          size={20} 
          name={isExpanded ? "chevron.up" : "chevron.down"} 
          color="#666" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Overall Score Circle */}
          <View style={styles.overallScoreContainer}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(overallScore) }]}>
              <ThemedText style={[styles.overallScoreText, { color: getScoreColor(overallScore) }]}>
                {overallScore}
              </ThemedText>
              <ThemedText style={styles.overallScoreLabel}>Overall</ThemedText>
            </View>
          </View>

          {/* Individual Scores */}
          <View style={styles.scoresContainer}>
            {renderScoreBar("Fluency & Coherence", metrics.fluencyCoherence.score)}
            {renderScoreBar("Grammar Accuracy", metrics.grammarAccuracy.score)}
            {renderScoreBar("Vocabulary Range", metrics.vocabularyRange.score)}
            {renderScoreBar("Pronunciation & Intelligibility", metrics.pronunciationIntelligibility.score)}
            {renderScoreBar("Pragmatic Appropriateness", Math.round(metrics.pragmaticsRegister.formalityMatch / 10))}
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <IconSymbol size={16} name="info.circle.fill" color="#4A86E8" />
            <ThemedText style={styles.noteText}>
              Scores are normalized on a scale of 0-10, with 10 being the highest level of proficiency.
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
  overallScoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  overallScoreText: {
    fontSize: 24,
    fontWeight: '700',
  },
  overallScoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scoresContainer: {
    gap: 16,
  },
  scoreBarContainer: {
    marginBottom: 8,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  scoreBarValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'right',
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#4A86E8',
    flex: 1,
    lineHeight: 16,
  },
}); 
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DetailedMetrics } from '@/types';

interface Props {
  overallScore: number;
  metrics: DetailedMetrics;
}

const { width: screenWidth } = Dimensions.get('window');

export const Scorecard: React.FC<Props> = ({ overallScore, metrics }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded to match screenshot

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4A86E8'; // Blue for high scores
    if (score >= 6) return '#4A86E8'; // Blue for medium scores  
    return '#4A86E8'; // Blue for all scores to match screenshot
  };

  const getScoreBarWidth = (score: number): string => {
    return `${(score / 10) * 100}%`;
  };

  const renderScoreCard = (label: string, score: number, isFullWidth: boolean = false) => (
    <View style={[styles.scoreCard, isFullWidth && styles.scoreCardFullWidth]}>
      <View style={styles.scoreCardHeader}>
        <ThemedText style={styles.scoreCardLabel} numberOfLines={2}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.scoreCardValue, { color: getScoreColor(score) }]}>
          {score}
        </ThemedText>
      </View>
      <View style={styles.scoreBarTrack}>
        <View 
          style={[
            styles.scoreBarFill, 
            { 
              width: getScoreBarWidth(score) as any,
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
          {/* Grid Layout for Scores */}
          <View style={styles.gridContainer}>
            {/* First Row - 2 cards */}
            <View style={styles.gridRow}>
              {renderScoreCard("Fluency & Coherence", metrics.fluencyCoherence.score)}
              {renderScoreCard("Grammar Accuracy", metrics.grammarAccuracy.score)}
            </View>
            
            {/* Second Row - 2 cards */}
            <View style={styles.gridRow}>
              {renderScoreCard("Vocabulary Range", metrics.vocabularyRange.score)}
              {renderScoreCard("Pronunciation & Intelligibility", metrics.pronunciationIntelligibility.score)}
            </View>
            
            {/* Third Row - 1 full width card */}
            <View style={styles.gridRow}>
              {renderScoreCard("Pragmatic Appropriateness", Math.round(metrics.pragmaticsRegister.formalityMatch / 10), true)}
            </View>
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
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  gridContainer: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 100,
  },
  scoreCardFullWidth: {
    flex: 1,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    minHeight: 40,
  },
  scoreCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  scoreCardValue: {
    fontSize: 24,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },
  scoreBarTrack: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
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
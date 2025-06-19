import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Strength, Improvement } from '@/types';

interface Props {
  strengths: Strength[];
  improvements: Improvement[];
}

export const StrengthsImprovements: React.FC<Props> = ({ strengths, improvements }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle" style={styles.title}>Strengths & Improvements</ThemedText>
        <IconSymbol 
          size={20} 
          name={isExpanded ? "chevron.up" : "chevron.down"} 
          color="#666" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Top 3 Strengths */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Top 3 Strengths</ThemedText>
            {strengths.map((strength, index) => (
              <View key={index} style={styles.strengthItem}>
                <View style={styles.strengthHeader}>
                  <IconSymbol size={20} name="checkmark.circle.fill" color="#4CAF50" />
                  <ThemedText style={styles.strengthTitle}>{strength.title}</ThemedText>
                </View>
                <ThemedText style={styles.strengthDescription}>{strength.description}</ThemedText>
              </View>
            ))}
          </View>

          {/* Top 3 Weaknesses → Action */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Top 3 Weaknesses → Action</ThemedText>
            {improvements.map((improvement, index) => (
              <View key={index} style={styles.improvementItem}>
                <View style={styles.improvementHeader}>
                  <IconSymbol size={20} name="exclamationmark.triangle.fill" color="#FF9800" />
                  <ThemedText style={styles.improvementTitle}>{improvement.title}</ThemedText>
                </View>
                <ThemedText style={styles.improvementDescription}>{improvement.description}</ThemedText>
                <View style={styles.actionContainer}>
                  <ThemedText style={styles.actionLabel}>Action:</ThemedText>
                  <ThemedText style={styles.actionText}>{improvement.action}</ThemedText>
                </View>
              </View>
            ))}
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
    color: '#333',
    marginBottom: 16,
  },
  strengthItem: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 12,
    flex: 1,
  },
  strengthDescription: {
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 20,
    marginLeft: 32,
  },
  improvementItem: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  improvementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginLeft: 12,
    flex: 1,
  },
  improvementDescription: {
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
    marginLeft: 32,
    marginBottom: 8,
  },
  actionContainer: {
    marginLeft: 32,
    marginTop: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#BF360C',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#D84315',
    lineHeight: 20,
    fontStyle: 'italic',
  },
}); 
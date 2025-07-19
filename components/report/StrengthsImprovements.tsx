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
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle" style={styles.title}>Strengths & Improvements</ThemedText>
        <View style={styles.iconContainer}>
          <IconSymbol 
            size={20} 
            name={isExpanded ? "chevron.up" : "chevron.down"} 
            color="#000" 
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Top 3 Strengths */}
          <View style={styles.section}>
            <ThemedText style={styles.strengthsSectionTitle}>Top 3 Strengths</ThemedText>
            <View style={styles.itemsContainer}>
              {strengths.map((strength, index) => (
                <View key={index} style={styles.strengthItem}>
                  <View style={styles.itemHeader}>
                    <View style={styles.iconWrapper}>
                      <IconSymbol size={16} name="checkmark.circle.fill" color="#4CAF50" />
                    </View>
                    <View style={styles.textContainer}>
                      <ThemedText style={styles.strengthTitle}>{strength.title}</ThemedText>
                      <ThemedText style={styles.strengthDescription}>{strength.description}</ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Top 3 Weaknesses → Action */}
          {improvements.length > 0 && <View style={styles.section}>
            <ThemedText style={styles.weaknessesSectionTitle}>Top 3 Weaknesses → Action</ThemedText>
            <View style={styles.itemsContainer}>
              {improvements.map((improvement, index) => (
                <View key={index} style={styles.improvementItem}>
                  <View style={styles.itemHeader}>
                    <View style={styles.iconWrapper}>
                      <IconSymbol size={16} name="exclamationmark.triangle.fill" color="#FF9500" />
                    </View>
                    <View style={styles.textContainer}>
                      <ThemedText style={styles.improvementTitle}>{improvement.title}</ThemedText>
                      <ThemedText style={styles.improvementDescription}>{improvement.description}</ThemedText>
                      <View style={styles.actionRow}>
                        <ThemedText style={styles.actionLabel}>Action: </ThemedText>
                        <ThemedText style={styles.actionText}>{improvement.action}</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>}
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
  section: {
    marginBottom: 24,
  },
  strengthsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 12,
  },
  weaknessesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 12,
  },
  itemsContainer: {
    gap: 12,
  },
  strengthItem: {
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  improvementItem: {
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  strengthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  improvementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  strengthDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  improvementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
}); 
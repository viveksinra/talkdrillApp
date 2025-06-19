import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ActionPlan as ActionPlanType } from '@/types';

interface Props {
  actionPlan: ActionPlanType;
}

export const ActionPlan: React.FC<Props> = ({ actionPlan }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle" style={styles.title}>Action Plan</ThemedText>
        <IconSymbol 
          size={20} 
          name={isExpanded ? "chevron.up" : "chevron.down"} 
          color="#666" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Short-term goals */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Short-term goals (1-2 weeks)</ThemedText>
            {actionPlan.shortTerm.map((task, index) => (
              <View key={index} style={styles.taskItem}>
                <View style={styles.taskHeader}>
                  <IconSymbol size={16} name="circle" color="#4A86E8" />
                  <ThemedText style={styles.taskText}>{task.task}</ThemedText>
                </View>
                <ThemedText style={styles.timeframe}>{task.timeframe}</ThemedText>
              </View>
            ))}
          </View>

          {/* Mid-term goals */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Mid-term goals (1-2 months)</ThemedText>
            {actionPlan.midTerm.map((task, index) => (
              <View key={index} style={styles.taskItem}>
                <View style={styles.taskHeader}>
                  <IconSymbol size={16} name="circle" color="#34A853" />
                  <ThemedText style={styles.taskText}>{task.task}</ThemedText>
                </View>
                <ThemedText style={styles.timeframe}>{task.timeframe}</ThemedText>
              </View>
            ))}
          </View>

          {/* Resources */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Resources</ThemedText>
            
            {/* Apps */}
            <View style={styles.resourceSection}>
              <View style={styles.resourceHeader}>
                <IconSymbol size={16} name="smartphone" color="#4A86E8" />
                <ThemedText style={styles.resourceTitle}>Apps</ThemedText>
              </View>
              <View style={styles.resourceList}>
                {actionPlan.resources.apps.map((app, index) => (
                  <ThemedText key={index} style={styles.resourceItem}>• {app}</ThemedText>
                ))}
              </View>
            </View>

            {/* Podcasts */}
            <View style={styles.resourceSection}>
              <View style={styles.resourceHeader}>
                <IconSymbol size={16} name="headphones" color="#34A853" />
                <ThemedText style={styles.resourceTitle}>Podcasts</ThemedText>
              </View>
              <View style={styles.resourceList}>
                {actionPlan.resources.podcasts.map((podcast, index) => (
                  <ThemedText key={index} style={styles.resourceItem}>• {podcast}</ThemedText>
                ))}
              </View>
            </View>

            {/* Worksheets */}
            <View style={styles.resourceSection}>
              <View style={styles.resourceHeader}>
                <IconSymbol size={16} name="doc.text" color="#FF9800" />
                <ThemedText style={styles.resourceTitle}>Worksheets</ThemedText>
              </View>
              <View style={styles.resourceList}>
                {actionPlan.resources.worksheets.map((worksheet, index) => (
                  <ThemedText key={index} style={styles.resourceItem}>• {worksheet}</ThemedText>
                ))}
              </View>
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
  taskItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  timeframe: {
    fontSize: 12,
    color: '#666',
    marginLeft: 24,
    fontStyle: 'italic',
  },
  resourceSection: {
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  resourceList: {
    marginLeft: 24,
  },
  resourceItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
}); 
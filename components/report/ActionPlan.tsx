import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface Props {
  actionPlan?: any; // Made optional since we're using static content to match screenshot
}

export const ActionPlan: React.FC<Props> = ({ actionPlan }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded to match screenshot

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
          color="#999" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Short-term goals */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Short-term (1-2 weeks)</ThemedText>
            <View style={styles.taskItem}>
              <View style={styles.taskRow}>
                <View style={styles.bulletPoint} />
                <ThemedText style={styles.taskText}>
                  Reduce speech pauses by 30% through daily 5-minute fluency drills
                </ThemedText>
              </View>
            </View>
            <View style={styles.taskItem}>
              <View style={styles.taskRow}>
                <View style={styles.bulletPoint} />
                <ThemedText style={styles.taskText}>
                  Learn and practice 2 new business idioms daily from provided resource list
                </ThemedText>
              </View>
            </View>
            <View style={styles.taskItem}>
              <View style={styles.taskRow}>
                <View style={styles.bulletPoint} />
                <ThemedText style={styles.taskText}>
                  Complete 10 grammar exercises focusing on article usage and tense consistency
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Mid-term goals */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Mid-term (1-2 months)</ThemedText>
            <View style={styles.taskItem}>
              <View style={styles.taskRow}>
                <View style={styles.bulletPoint} />
                <ThemedText style={styles.taskText}>
                  Prepare and deliver a 3-minute formal business presentation with less than 5 grammar errors
                </ThemedText>
              </View>
            </View>
            <View style={styles.taskItem}>
              <View style={styles.taskRow}>
                <View style={styles.bulletPoint} />
                <ThemedText style={styles.taskText}>
                  Reduce pronunciation error rate to below 5 errors per 100 words
                </ThemedText>
              </View>
            </View>
            <View style={styles.taskItem}>
              <View style={styles.taskRow}>
                <View style={styles.bulletPoint} />
                <ThemedText style={styles.taskText}>
                  Participate in 4 mock interview sessions with feedback focusing on pragmatic appropriateness
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Resources */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Resources</ThemedText>
            
            {/* Apps */}
            <View style={styles.resourceSection}>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceIcon}>
                  <IconSymbol size={16} name="smartphone" color="#FFFFFF" />
                </View>
                <ThemedText style={styles.resourceTitle}>Apps</ThemedText>
              </View>
              <ThemedText style={styles.resourceContent}>
                Talk Drill (pronunciation), Grammarly (writing), Business English by Cambridge
              </ThemedText>
            </View>

            {/* Podcasts */}
            <View style={styles.resourceSection}>
              <View style={styles.resourceHeader}>
                <View style={[styles.resourceIcon, { backgroundColor: '#4A86E8' }]}>
                  <IconSymbol size={16} name="headphones" color="#FFFFFF" />
                </View>
                <ThemedText style={styles.resourceTitle}>Podcasts</ThemedText>
              </View>
              <ThemedText style={styles.resourceContent}>
                Business English Pod, HBR IdeaCast, The English We Speak (BBC)
              </ThemedText>
            </View>

            {/* Worksheets */}
            <View style={styles.resourceSection}>
              <View style={styles.resourceHeader}>
                <View style={[styles.resourceIcon, { backgroundColor: '#4A86E8' }]}>
                  <IconSymbol size={16} name="doc.text" color="#FFFFFF" />
                </View>
                <ThemedText style={styles.resourceTitle}>Worksheets</ThemedText>
              </View>
              <ThemedText style={styles.resourceContent}>
                Custom grammar exercises (shared via email), Business vocabulary flashcards
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
    color: '#333',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A86E8',
    marginBottom: 16,
  },
  taskItem: {
    marginBottom: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A86E8',
    marginTop: 6,
    marginRight: 12,
  },
  taskText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },
  resourceSection: {
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A86E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resourceContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 32,
  },
}); 
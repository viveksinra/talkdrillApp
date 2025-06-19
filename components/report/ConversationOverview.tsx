import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ConversationOverview as ConversationOverviewType } from '@/types';

interface Props {
  overview: ConversationOverviewType;
}

export const ConversationOverview: React.FC<Props> = ({ overview }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getGoalStyle = (goal: string) => {
    switch (goal) {
      case 'Business':
        return styles.businessGoal;
      case 'Casual':
        return styles.casualGoal;
      case 'Academic':
        return styles.academicGoal;
      default:
        return styles.businessGoal;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Conversation Overview</ThemedText>
      
      {/* Participants */}
      <View style={styles.section}>
        <ThemedText style={styles.label}>Participants</ThemedText>
        <View style={styles.participantsContainer}>
          {overview.participants.map((participant, index) => (
            <View key={index} style={styles.participant}>
              <View style={[styles.participantIcon, participant.role === 'user' ? styles.userIcon : styles.aiIcon]}>
                <ThemedText style={styles.participantInitial}>
                  {participant.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <ThemedText style={styles.participantName}>{participant.name}</ThemedText>
              {index < overview.participants.length - 1 && (
                <IconSymbol size={16} name="arrow.right" color="#888" style={styles.arrow} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Date and Duration */}
      <View style={styles.row}>
        <View style={styles.column}>
          <ThemedText style={styles.label}>Date</ThemedText>
          <ThemedText style={styles.value}>{formatDate(overview.date)}</ThemedText>
        </View>
        <View style={styles.column}>
          <ThemedText style={styles.label}>Duration</ThemedText>
          <ThemedText style={styles.value}>{overview.duration} minutes</ThemedText>
        </View>
      </View>

      {/* Scenario/Topic */}
      <View style={styles.section}>
        <ThemedText style={styles.label}>Scenario/Topic</ThemedText>
        <ThemedText style={styles.value}>{overview.scenario}</ThemedText>
      </View>

      {/* Goal */}
      <View style={styles.section}>
        <ThemedText style={styles.label}>Goal</ThemedText>
        <View style={styles.goalContainer}>
          <View style={[styles.goalPill, getGoalStyle(overview.goal)]}>
            <ThemedText style={styles.goalText}>{overview.goal}</ThemedText>
          </View>
          <View style={[styles.goalPill, styles.inactiveGoal]}>
            <ThemedText style={styles.inactiveGoalText}>Casual</ThemedText>
          </View>
          <View style={[styles.goalPill, styles.inactiveGoal]}>
            <ThemedText style={styles.inactiveGoalText}>Academic</ThemedText>
          </View>
        </View>
      </View>

      {/* Excerpt */}
      {overview.excerpt && (
        <View style={styles.section}>
          <ThemedText style={styles.label}>Excerpt (optional)</ThemedText>
          <ThemedText style={styles.excerpt}>{overview.excerpt}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  column: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userIcon: {
    backgroundColor: '#E3F2FD',
  },
  aiIcon: {
    backgroundColor: '#E8F5E8',
  },
  participantInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  arrow: {
    marginHorizontal: 8,
  },
  goalContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  goalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  businessGoal: {
    backgroundColor: '#4A86E8',
  },
  casualGoal: {
    backgroundColor: '#34A853',
  },
  academicGoal: {
    backgroundColor: '#9C27B0',
  },
  inactiveGoal: {
    backgroundColor: '#F5F5F5',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  inactiveGoalText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  excerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ConversationOverview as ConversationOverviewType } from '@/types';

interface Props {
  overview: ConversationOverviewType;
}

const { width: screenWidth } = Dimensions.get('window');

export const ConversationOverview: React.FC<Props> = ({ overview }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Get participant colors based on their role or name
  const getParticipantColor = (participant: any, index: number) => {
    if (index === 0) return '#4A86E8'; // Blue for first participant
    return '#34A853'; // Green for second participant
  };

  // Determine if we should stack date/duration on small screens
  const shouldStackDateDuration = screenWidth < 360; // Small screens

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Conversation Overview</ThemedText>
      
      {/* Participants */}
      <View style={styles.section}>
        <ThemedText style={styles.label}>Participants</ThemedText>
        <View style={styles.participantsContainer}>
          {overview.participants.map((participant, index) => (
            <React.Fragment key={index}>
              <View style={styles.participantItem}>
                <View style={[styles.participantIcon, { backgroundColor: getParticipantColor(participant, index) }]}>
                  <ThemedText style={styles.participantInitial}>
                    {participant.name.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.participantNameContainer}>
                  <ThemedText style={styles.participantName} numberOfLines={1} ellipsizeMode="tail">
                    {participant.name}
                  </ThemedText>
                </View>
              </View>
              {index < overview.participants.length - 1 && (
                <View style={styles.arrowContainer}>
                  <ThemedText style={styles.bidirectionalArrow}>⇄</ThemedText>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Date and Duration */}
      <View style={[styles.row, shouldStackDateDuration && styles.column]}>
        <View style={[styles.dateColumn, shouldStackDateDuration && styles.fullWidth]}>
          <ThemedText style={styles.label}>Date</ThemedText>
          <View style={styles.inputBox}>
            <ThemedText style={styles.inputValue} numberOfLines={1} ellipsizeMode="tail">
              {formatDate(overview.date)}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.durationColumn, shouldStackDateDuration && styles.fullWidth]}>
          <ThemedText style={styles.label}>Duration</ThemedText>
          <View style={styles.inputBox}>
            <ThemedText style={styles.inputValue} numberOfLines={1}>
              {Math.round(overview.duration)} minutes
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Scenario/Topic */}
      <View style={styles.section}>
        <ThemedText style={styles.label}>Scenario/Topic</ThemedText>
        <View style={styles.inputBox}>
          <ThemedText style={styles.inputValue} numberOfLines={2} ellipsizeMode="tail">
            {overview.scenario}
          </ThemedText>
        </View>
      </View>

      {/* Excerpt */}
      {overview.excerpt && (
        <View style={styles.section}>
          <ThemedText style={styles.label}>Excerpt (optional)</ThemedText>
          <View style={[styles.inputBox, styles.excerptBox]}>
            <ThemedText style={styles.excerptValue} numberOfLines={4} ellipsizeMode="tail">
              {overview.excerpt}
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
    padding: 16,
    marginBottom: 16,
    maxWidth: '100%',
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  column: {
    flexDirection: 'column',
    gap: 12,
  },
  dateColumn: {
    flex: 1,
    minWidth: 0, // Allows flex item to shrink below content size
  },
  durationColumn: {
    flex: 1,
    minWidth: 0, // Allows flex item to shrink below content size
  },
  fullWidth: {
    flex: 1,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping on very small screens
    gap: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0, // Important for text truncation
    maxWidth: screenWidth < 320 ? 120 : 150, // Limit width on small screens
  },
  participantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0, // Don't shrink the icon
  },
  participantNameContainer: {
    flex: 1,
    minWidth: 0, // Important for text truncation
  },
  participantInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  arrowContainer: {
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  bidirectionalArrow: {
    fontSize: 16,
    color: '#666',
  },
  inputBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
    width: '100%',
  },
  excerptBox: {
    minHeight: 60, // Give more height for excerpt
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  excerptValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 
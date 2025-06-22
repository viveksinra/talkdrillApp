import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { VisualsData } from '@/types';
import { RadarChart } from './RadarChart';
import { SimpleLineChart } from './SimpleLineChart';
import { SimpleBarChart } from './SimpleBarChart';

interface Props {
  visualsData: VisualsData;
}

const { width: screenWidth } = Dimensions.get('window');

export const Visuals: React.FC<Props> = ({ visualsData }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle" style={styles.title}>Visuals</ThemedText>
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
          {/* Error Rate Over Time */}
          <SimpleLineChart errorRateOverTime={visualsData.errorRateOverTime} />
          
          {/* Skill Profile */}
          <View style={styles.chartContainer}>
            <ThemedText style={styles.chartTitle}>Skill Profile</ThemedText>
            <RadarChart skillProfile={visualsData.skillProfile} />
          </View>
          
          {/* Vocabulary vs Target */}
          <SimpleBarChart vocabularyComparison={visualsData.vocabularyComparison} />
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
  chartContainer: {
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
}); 
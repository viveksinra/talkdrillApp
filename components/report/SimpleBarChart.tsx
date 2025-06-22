import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface VocabularyData {
  level: string;
  current: number;
  target: number;
}

interface Props {
  vocabularyComparison: VocabularyData[];
}

const { width: screenWidth } = Dimensions.get('window');

export const SimpleBarChart: React.FC<Props> = ({ vocabularyComparison }) => {
  const chartHeight = 140;
  const maxValue = 50000; // Fixed scale to match design
  
  return (
    <View style={styles.container}>
      <ThemedText style={styles.chartTitle}>Vocabulary vs. Target</ThemedText>
      <ThemedText style={styles.chartSubtitle}>
        Current vocabulary vs target level (level)
      </ThemedText>
      
      <View style={styles.vocabChartWrapper}>
        {/* Y-Axis Labels */}
        <View style={styles.vocabYAxis}>
          <ThemedText style={styles.vocabYLabel}>50000</ThemedText>
          <ThemedText style={styles.vocabYLabel}>15000</ThemedText>
          <ThemedText style={styles.vocabYLabel}>7500</ThemedText>
          <ThemedText style={styles.vocabYLabel}>5000</ThemedText>
          <ThemedText style={styles.vocabYLabel}>2000</ThemedText>
          <ThemedText style={styles.vocabYLabel}>1000</ThemedText>
          <ThemedText style={styles.vocabYLabel}>500</ThemedText>
          <ThemedText style={styles.vocabYLabel}>0</ThemedText>
        </View>
        
        {/* Bar Chart */}
        <View style={styles.vocabBarsContainer}>
          {vocabularyComparison.map((item, index) => {
            const barHeight = (item.current / maxValue) * chartHeight;
            
            return (
              <View key={index} style={styles.vocabBarGroup}>
                <View 
                  style={[
                    styles.vocabBar, 
                    { 
                      height: barHeight,
                      backgroundColor: index === vocabularyComparison.length - 1 ? '#B8D4FF' : '#4A86E8'
                    }
                  ]} 
                />
              </View>
            );
          })}
        </View>
      </View>
      
      {/* X-Axis Labels */}
      <View style={styles.vocabXAxis}>
        {vocabularyComparison.map((item, index) => (
          <ThemedText key={index} style={styles.vocabXLabel}>
            {item.level}
          </ThemedText>
        ))}
      </View>
      
      {/* Legend */}
      <View style={styles.vocabLegend}>
        <View style={styles.vocabLegendItem}>
          <View style={[styles.vocabLegendColor, { backgroundColor: '#4A86E8' }]} />
          <ThemedText style={styles.vocabLegendText}>Target level</ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  vocabChartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  vocabYAxis: {
    justifyContent: 'space-between',
    marginRight: 12,
    height: 140,
  },
  vocabYLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'right',
    minWidth: 35,
  },
  vocabBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    height: 140,
    paddingHorizontal: 4,
  },
  vocabBarGroup: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  vocabBar: {
    width: '80%',
    borderRadius: 2,
    minHeight: 2,
  },
  vocabXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 47,
    marginTop: 8,
  },
  vocabXLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    maxWidth: 25,
  },
  vocabLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  vocabLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vocabLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  vocabLegendText: {
    fontSize: 10,
    color: '#666',
  },
}); 
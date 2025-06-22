import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface ErrorRateData {
  time: string;
  errorRate: number;
}

interface Props {
  errorRateOverTime: ErrorRateData[];
}

const { width: screenWidth } = Dimensions.get('window');

export const SimpleLineChart: React.FC<Props> = ({ errorRateOverTime }) => {
  const chartHeight = 160;
  const chartWidth = screenWidth - 64;
  const maxError = 25; // Fixed scale to match design (0-25%)
  
  return (
    <View style={styles.container}>
      <ThemedText style={styles.chartTitle}>Error Rate Over Time</ThemedText>
      <View style={styles.lineChartWrapper}>
        {/* Y-Axis */}
        <View style={styles.yAxisContainer}>
          <ThemedText style={styles.yAxisLabel}>200%</ThemedText>
          <ThemedText style={styles.yAxisLabel}>100%</ThemedText>
          <ThemedText style={styles.yAxisLabel}>15%</ThemedText>
          <ThemedText style={styles.yAxisLabel}>20%</ThemedText>
          <ThemedText style={styles.yAxisLabel}>10%</ThemedText>
          <ThemedText style={styles.yAxisLabel}>0</ThemedText>
        </View>
        
        {/* Chart Area */}
        <View style={[styles.lineChartArea, { height: chartHeight, width: chartWidth - 60 }]}>
          {/* Grid Lines */}
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View 
              key={index} 
              style={[
                styles.horizontalGridLine, 
                { top: (index * chartHeight) / 5 }
              ]} 
            />
          ))}
          
          {/* Line Chart with connected segments */}
          <View style={styles.linePathContainer}>
            {errorRateOverTime.map((point, index) => {
              const x = (index / (errorRateOverTime.length - 1)) * 100;
              const y = 100 - ((point.errorRate / maxError) * 100);
              
              return (
                <View key={index}>
                  {/* Data Point */}
                  <View
                    style={[
                      styles.lineDataPoint,
                      {
                        left: `${x}%`,
                        top: `${y}%`,
                      }
                    ]}
                  />
                  
                  {/* Line Segment to Next Point */}
                  {index < errorRateOverTime.length - 1 && (
                    <View
                      style={[
                        styles.lineSegment,
                        {
                          left: `${x}%`,
                          top: `${y}%`,
                          width: `${100 / (errorRateOverTime.length - 1)}%`,
                          transform: [
                            {
                              rotate: `${Math.atan2(
                                ((errorRateOverTime[index + 1].errorRate - point.errorRate) / maxError) * chartHeight,
                                chartWidth / (errorRateOverTime.length - 1)
                              )}rad`
                            }
                          ]
                        }
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
      
      {/* X-Axis Labels */}
      <View style={styles.xAxisContainer}>
        {errorRateOverTime.map((point, index) => (
          <ThemedText key={index} style={styles.xAxisLabel}>
            {point.time}
          </ThemedText>
        ))}
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
  lineChartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  yAxisContainer: {
    justifyContent: 'space-between',
    marginRight: 12,
    height: 160,
    paddingTop: 5,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    minWidth: 30,
  },
  lineChartArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    position: 'relative',
    flex: 1,
  },
  horizontalGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  linePathContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineDataPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A86E8',
    marginLeft: -3,
    marginTop: -3,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#4A86E8',
    transformOrigin: 'left center',
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 42,
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    maxWidth: 30,
  },
}); 
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export const DailyStreakCard: React.FC = () => {
  const { user } = useAuth();
  
  // Get level number and next target
  const getLevelNumber = (level: string): number => {
    switch (level) {
      case 'basic': return 1;
      case 'pro': return 2;
      case 'advanced': return 3;
      default: return 1;
    }
  };
  
  const getNextTarget = (currentStreak: number): number => {
    if (currentStreak < 7) return 7;
    if (currentStreak < 15) return 15;
    if (currentStreak < 30) return 30;
    return 30; // Max target
  };
  
  const currentStreak = user?.dailyStreak || 0;
  const currentLevel = user?.level || 'basic';
  const levelNumber = getLevelNumber(currentLevel);
  const nextTarget = getNextTarget(currentStreak);
  const progressPercentage = Math.min((currentStreak / nextTarget) * 100, 100);
  
  // Create progress dots
  const renderProgressDots = () => {
    const totalDots = 12;
    const filledDots = Math.floor((currentStreak / nextTarget) * totalDots);
    
    return (
      <View style={styles.progressDots}>
        {Array.from({ length: totalDots }, (_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index < filledDots ? styles.progressDotFilled : styles.progressDotEmpty
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Practice</Text>
          <Text style={styles.subtitle}>{currentStreak}-day streak</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv. {levelNumber}</Text>
        </View>
      </View>
      
      <View style={styles.targetSection}>
        <Text style={styles.targetText}>Next Target: {nextTarget} days</Text>
        <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>
        {renderProgressDots()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6366F1', // Solid purple background instead of gradient
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 24,
    // Add some shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  targetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetText: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressSection: {
    gap: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  progressDot: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
  },
  progressDotFilled: {
    backgroundColor: '#FFFFFF',
  },
  progressDotEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
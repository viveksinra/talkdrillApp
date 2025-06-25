import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface StreakCalendarProps {
  activities: Array<{
    date: string;
    activitiesCount: number;
    coinsEarned: number;
    streakDay: number;
  }>;
  currentStreak: number;
  onDatePress?: (date: string) => void;
}

export default function StreakCalendar({
  activities,
  currentStreak,
  onDatePress
}: StreakCalendarProps) {
  
  // Get the last 30 days for display
  const getLast30Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getActivityForDate = (date: Date) => {
    const dateString = formatDate(date);
    return activities.find(activity => 
      activity.date.split('T')[0] === dateString
    );
  };

  const getIntensityColor = (activitiesCount: number) => {
    if (activitiesCount === 0) return '#F5F5F5';
    if (activitiesCount === 1) return '#C8E6C9';
    if (activitiesCount === 2) return '#81C784';
    if (activitiesCount >= 3) return '#4CAF50';
    return '#2E7D32';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getLast30Days();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          Activity Calendar
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Last 30 days
        </ThemedText>
      </View>

      {/* Week day labels */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayLabel}>
            <ThemedText style={styles.weekDayText}>{day}</ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendar}>
        {/* Create rows of 7 days */}
        {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
              const activity = getActivityForDate(date);
              const activitiesCount = activity?.activitiesCount || 0;
              const isCurrentDay = isToday(date);
              
              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.day,
                    {
                      backgroundColor: getIntensityColor(activitiesCount),
                      borderColor: isCurrentDay ? '#4A86E8' : 'transparent',
                      borderWidth: isCurrentDay ? 2 : 0,
                    }
                  ]}
                  onPress={() => onDatePress?.(formatDate(date))}
                  disabled={!activity}
                >
                  <ThemedText style={[
                    styles.dayText,
                    { 
                      color: activitiesCount > 0 ? '#FFFFFF' : '#999',
                      fontWeight: isCurrentDay ? 'bold' : 'normal'
                    }
                  ]}>
                    {date.getDate()}
                  </ThemedText>
                  {activitiesCount > 0 && (
                    <View style={styles.activityDot}>
                      <ThemedText style={styles.activityCount}>
                        {activitiesCount}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            {/* Fill empty cells if the week is incomplete */}
            {weekIndex === Math.ceil(days.length / 7) - 1 && 
             days.slice(weekIndex * 7).length < 7 && 
             Array.from({ length: 7 - days.slice(weekIndex * 7).length }, (_, emptyIndex) => (
               <View key={`empty-${emptyIndex}`} style={styles.emptyDay} />
             ))
            }
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <ThemedText style={styles.legendText}>Less</ThemedText>
        <View style={styles.legendColors}>
          <View style={[styles.legendSquare, { backgroundColor: '#F5F5F5' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#C8E6C9' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#81C784' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#4CAF50' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#2E7D32' }]} />
        </View>
        <ThemedText style={styles.legendText}>More</ThemedText>
      </View>

      {/* Current streak info */}
      <View style={styles.streakInfo}>
        <View style={styles.streakBadge}>
          <ThemedText style={styles.streakNumber}>{currentStreak}</ThemedText>
          <ThemedText style={styles.streakLabel}>day streak</ThemedText>
        </View>
        <View style={styles.streakStats}>
          <ThemedText style={styles.streakStatsText}>
            {activities.filter(a => a.activitiesCount > 0).length} active days
          </ThemedText>
          <ThemedText style={styles.streakStatsText}>
            {activities.reduce((sum, a) => sum + a.coinsEarned, 0)} coins earned
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  calendar: {
    marginBottom: 16,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 32,
  },
  emptyDay: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    minWidth: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCount: {
    fontSize: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  legendColors: {
    flexDirection: 'row',
    gap: 2,
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  streakBadge: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
  },
  streakStats: {
    alignItems: 'flex-end',
  },
  streakStatsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
}); 
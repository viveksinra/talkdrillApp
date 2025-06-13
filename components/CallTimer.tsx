import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CallDurationManager } from '../utils/callDurationManager';
import { Colors } from '@/constants/Colors';

interface CallTimerProps {
  durationManager: CallDurationManager | null;
  style?: any;
}

export const CallTimer: React.FC<CallTimerProps> = ({ durationManager, style }) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!durationManager) return;

    // Set up the timer callback
    const updateCallback = (remainingSeconds: number) => {
      setRemainingTime(remainingSeconds);
      setIsWarning(remainingSeconds <= 120); // Warning when 2 minutes or less
    };

    // This would need to be set up when creating the duration manager
    // For now, we'll get the initial timer info
    const initializeTimer = async () => {
      try {
        const timerInfo = await durationManager.getCallTimerInfo();
        if (timerInfo && timerInfo.has_timer && timerInfo.remaining_seconds) {
          setRemainingTime(timerInfo.remaining_seconds);
          setIsWarning(timerInfo.remaining_seconds <= 120);
        }
      } catch (error) {
        console.error('Error initializing call timer:', error);
      }
    };

    initializeTimer();

    return () => {
      // Cleanup if needed
    };
  }, [durationManager]);

  if (remainingTime === null) {
    return null;
  }

  const formatTime = CallDurationManager.formatTime;
  const timeText = remainingTime > 0 ? `Time remaining: ${formatTime(remainingTime)}` : 'Call time expired';

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.timerBadge, isWarning && styles.warningBadge]}>
        <Text style={[styles.timerIcon]}>⏰</Text>
        <Text style={[styles.timerText, isWarning && styles.warningText]}>
          {timeText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  warningBadge: {
    backgroundColor: Colors.light.secondaryDark || '#f59e0b',
  },
  timerIcon: {
    fontSize: 14,
    color: 'white',
  },
  timerText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  warningText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

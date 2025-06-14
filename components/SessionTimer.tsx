import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-native-sdk';
import { useRouter } from 'expo-router';
import streamService from '@/api/services/streamService';

interface SessionTimerProps {
  durationMinutes: number;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ durationMinutes }) => {
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  const router = useRouter();
  const [remainingSeconds, setRemainingSeconds] = useState<number>(durationMinutes * 60);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const didAlert = useRef(false);
  const callEndedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // **KEY FIX**: Use session.started_at for synchronized timing across all participants
  useEffect(() => {
    if (session?.started_at && !sessionStartTime) {
      const startTime = new Date(session.started_at);
      setSessionStartTime(startTime);
      console.log('Session started at (synchronized):', startTime.toISOString());
      startSynchronizedCountdown(startTime);
    }
  }, [session?.started_at]);

  const startSynchronizedCountdown = (sessionStart: Date) => {
    const totalDurationMs = durationMinutes * 60 * 1000;
    const sessionEndTime = new Date(sessionStart.getTime() + totalDurationMs);
    
    console.log('Synchronized timer:', {
      sessionStart: sessionStart.toISOString(),
      sessionEnd: sessionEndTime.toISOString(),
      durationMinutes
    });
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // **SYNCHRONIZED TIMER**: All participants calculate remaining time from the same session start
    timerRef.current = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((sessionEndTime.getTime() - now.getTime()) / 1000));
      
      setRemainingSeconds(remaining);
      
      // Show warning at 1 minute - **SYNCHRONIZED FOR ALL PARTICIPANTS**
      if (!didAlert.current && remaining <= 60 && remaining > 0) {
        didAlert.current = true;
        Alert.alert(
          'Call Ending Soon',
          'Less than 1 minute remaining',
          [{ text: 'OK' }]
        );
      }
      
      // End call when timer expires - **SYNCHRONIZED FOR ALL PARTICIPANTS**
      if (remaining <= 0 && !callEndedRef.current) {
        callEndedRef.current = true;
        endCallDueToTimeLimit();
      }
    }, 1000);
  };

  const endCallDueToTimeLimit = async () => {
    try {
      console.log('Ending call due to time limit');
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // End the call
      await streamService.endCall();
      
      Alert.alert(
        'Call Ended',
        'Your call has ended due to time limit',
        [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error ending call:', error);
      
      // **FIX**: Show the same alert even if there's an error
      Alert.alert(
        'Call Ended',
        'Your call has ended due to time limit',
        [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]
      );
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!sessionStartTime || remainingSeconds <= 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = remainingSeconds <= 60;

  return (
    <View style={styles.container}>
      <View style={[styles.timerBadge, isWarning && styles.warningBadge]}>
        <Text style={styles.timerIcon}>⏰</Text>
        <Text style={[styles.timerText, isWarning && styles.warningText]}>
          {formatTime(remainingSeconds)} left
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
  },
  timerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 
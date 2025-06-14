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
  const [isSessionActive, setIsSessionActive] = useState(false);
  const didAlert = useRef(false);
  const callEndedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // **KEY FIX**: Use session.started_at for synchronized timing across all participants
  useEffect(() => {
    console.log('SessionTimer: Session state changed', {
      hasSession: !!session,
      startedAt: session?.started_at,
      currentSessionStartTime: sessionStartTime
    });

    if (session?.started_at && !sessionStartTime) {
      const startTime = new Date(session.started_at);
      setSessionStartTime(startTime);
      setIsSessionActive(true);
      console.log('Session started at (synchronized):', startTime.toISOString());
      startSynchronizedCountdown(startTime);
    }
  }, [session?.started_at, sessionStartTime]);

  // **NEW**: Handle case where session exists but no started_at yet (session initializing)
  useEffect(() => {
    if (session && !session.started_at && !isSessionActive) {
      console.log('SessionTimer: Session exists but not started yet, showing initial timer');
      setIsSessionActive(true);
      // Show initial countdown until session actually starts
    }
  }, [session, isSessionActive]);

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

  // **FIXED**: Always show timer UI if session is active, even if sessionStartTime is not set yet
  if (!isSessionActive) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = remainingSeconds <= 60;
  
  // **NEW**: Show different states based on timer status
  const getTimerDisplay = () => {
    if (!sessionStartTime) {
      return 'Starting...';
    }
    if (remainingSeconds <= 0) {
      return 'Time expired';
    }
    return `${formatTime(remainingSeconds)} left`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.timerBadge, isWarning && styles.warningBadge, remainingSeconds <= 0 && styles.expiredBadge]}>
        <Text style={styles.timerIcon}>⏰</Text>
        <Text style={[styles.timerText, isWarning && styles.warningText, remainingSeconds <= 0 && styles.expiredText]}>
          {getTimerDisplay()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // position: 'absolute',
    // top: 60,
    // left: 16,
    // right: 16,
    // zIndex: 1000,
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
  expiredBadge: {
    backgroundColor: 'rgba(139, 69, 19, 0.9)', // Brown for expired
  },
  expiredText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 
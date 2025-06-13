import { Call } from '@stream-io/video-react-native-sdk';
import { Alert, Vibration } from 'react-native';
import { get, post } from '../api/config/axiosConfig';

export interface CallTimerInfo {
  has_timer: boolean;
  started_at?: string;
  timer_ends_at?: string;
  max_duration_seconds?: number;
  remaining_seconds?: number;
  remaining_minutes?: number;
  is_expired?: boolean;
  message?: string;
}

export interface DurationWarningEvent {
  type: 'call_duration_warning';
  message: string;
  minutes_remaining: number;
  seconds_remaining: number;
  timestamp: string;
}

export interface DurationExtendedEvent {
  type: 'call_duration_extended';
  message: string;
  additional_minutes: number;
  new_duration_seconds: number;
  timestamp: string;
}

export type CallDurationEvent = DurationWarningEvent | DurationExtendedEvent;

export class CallDurationManager {
  private call: Call | null = null;
  private callId: string | null = null;
  private isWarningShown: boolean = false;
  private countdownTimer: NodeJS.Timeout | null = null;
  private onTimerUpdate?: (remainingSeconds: number) => void;
  private onWarningReceived?: (event: DurationWarningEvent) => void;
  private onCallExtended?: (event: DurationExtendedEvent) => void;
  private onCallEnded?: () => void;

  constructor(
    call: Call,
    callId: string,
    callbacks?: {
      onTimerUpdate?: (remainingSeconds: number) => void;
      onWarningReceived?: (event: DurationWarningEvent) => void;
      onCallExtended?: (event: DurationExtendedEvent) => void;
      onCallEnded?: () => void;
    }
  ) {
    this.call = call;
    this.callId = callId;
    this.onTimerUpdate = callbacks?.onTimerUpdate;
    this.onWarningReceived = callbacks?.onWarningReceived;
    this.onCallExtended = callbacks?.onCallExtended;
    this.onCallEnded = callbacks?.onCallEnded;
    
    this.setupEventListeners();
    this.initializeTimerDisplay();
  }

  private setupEventListeners() {
    if (!this.call) return;

    // Listen for Stream custom events
    this.call.on('custom', (event: any) => {
      const { custom } = event;
      console.log('CallDurationManager: Received custom event:', custom);
      
      switch (custom.type) {
        case 'call_duration_warning':
          this.handleDurationWarning(custom as DurationWarningEvent);
          break;
        case 'call_duration_extended':
          this.handleDurationExtended(custom as DurationExtendedEvent);
          break;
        default:
          break;
      }
    });

    // Listen for call ended event
    this.call.on('call.ended', () => {
      this.handleCallEnded();
    });
  }

  private handleDurationWarning(eventData: DurationWarningEvent) {
    console.log('CallDurationManager: Handling duration warning:', eventData);
    
    if (this.isWarningShown) return;
    this.isWarningShown = true;

    // Vibrate device
    Vibration.vibrate([200, 100, 200]);

    // Show alert to user
    Alert.alert(
      '⚠️ Call Duration Warning',
      eventData.message,
      [
        {
          text: 'I Understand',
          onPress: () => {
            console.log('User acknowledged duration warning');
          },
        },
      ],
      { cancelable: false }
    );

    // Start countdown from the remaining seconds
    this.startCountdown(eventData.seconds_remaining || 60);

    // Call the callback if provided
    if (this.onWarningReceived) {
      this.onWarningReceived(eventData);
    }
  }

  private handleDurationExtended(eventData: DurationExtendedEvent) {
    console.log('CallDurationManager: Call duration extended:', eventData);
    
    this.isWarningShown = false;
    this.stopCountdown();

    // Show success alert
    Alert.alert(
      '✅ Call Extended',
      eventData.message,
      [{ text: 'OK' }]
    );

    // Call the callback if provided
    if (this.onCallExtended) {
      this.onCallExtended(eventData);
    }
  }

  private handleCallEnded() {
    console.log('CallDurationManager: Call ended due to duration limit');
    
    this.cleanup();

    // Show final alert
    Alert.alert(
      '📞 Call Ended',
      'Call has ended due to duration limit',
      [{ text: 'OK' }]
    );

    // Call the callback if provided
    if (this.onCallEnded) {
      this.onCallEnded();
    }
  }

  private startCountdown(seconds: number) {
    this.stopCountdown(); // Clear any existing countdown
    
    this.countdownTimer = setInterval(() => {
      if (seconds <= 0) {
        this.stopCountdown();
        return;
      }

      // Call the timer update callback
      if (this.onTimerUpdate) {
        this.onTimerUpdate(seconds);
      }

      seconds--;
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  async initializeTimerDisplay() {
    try {
      const timerInfo = await this.getCallTimerInfo();
      if (timerInfo && timerInfo.has_timer) {
        console.log('CallDurationManager: Call timer info:', timerInfo);
        
        if (timerInfo.remaining_seconds && timerInfo.remaining_seconds > 0) {
          // Start timer update callback for remaining time
          this.startTimerUpdateLoop(timerInfo.timer_ends_at!);
        }
      } else {
        console.log('CallDurationManager: No time limit set for this call');
      }
    } catch (error) {
      console.error('CallDurationManager: Error initializing timer display:', error);
    }
  }

  private startTimerUpdateLoop(timerEndsAt: string) {
    const updateTimer = () => {
      const endTime = new Date(timerEndsAt);
      const now = new Date();
      const remainingMs = endTime.getTime() - now.getTime();
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

      if (this.onTimerUpdate) {
        this.onTimerUpdate(remainingSeconds);
      }

      if (remainingSeconds <= 0) {
        return; // Stop updating
      }

      setTimeout(updateTimer, 1000);
    };

    updateTimer();
  }

  async getCallTimerInfo(): Promise<CallTimerInfo | null> {
    try {
      if (!this.callId) return null;

      const response = await get(`/api/v1/call/timer-info/${this.callId}`);
      
      if (response.data.variant === 'success') {
        return response.data.myData;
      } else {
        console.warn('CallDurationManager: Failed to get timer info:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('CallDurationManager: Error getting call timer info:', error);
      return null;
    }
  }

  async extendCallDuration(additionalMinutes: number): Promise<boolean> {
    try {
      if (!this.callId) return false;

      const response = await post('/api/v1/call/extend-duration', {
        callId: this.callId,
        additionalMinutes: additionalMinutes
      });

      if (response.data.variant === 'success') {
        Alert.alert(
          '✅ Success',
          response.data.message,
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert(
          '❌ Error',
          response.data.message,
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('CallDurationManager: Error extending call duration:', error);
      Alert.alert(
        '❌ Error',
        'Failed to extend call duration',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  cleanup() {
    this.stopCountdown();
    this.isWarningShown = false;
    this.call = null;
    this.callId = null;
  }

  // Helper method to format seconds into readable time
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

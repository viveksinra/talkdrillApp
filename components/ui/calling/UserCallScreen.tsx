import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import WebRTCService from '../../../api/services/webrtcService';
import socketService from '../../../api/services/socketService';
import { updateCallStatus } from '../../../api/services/callService';
import ThemedView from '../../ThemedView';
import ThemedText from '../../ThemedText';

interface UserCallScreenProps {
  callId: string;
  callerId: string;
  receiverId: string;
  receiverName: string;
  onEndCall: () => void;
  isOutgoing?: boolean;
}

const UserCallScreen: React.FC<UserCallScreenProps> = ({
  callId,
  callerId,
  receiverId,
  receiverName,
  onEndCall,
  isOutgoing = true
}) => {
  const [callStatus, setCallStatus] = useState<string>(isOutgoing ? 'calling' : 'incoming');
  const [callDuration, setCallDuration] = useState<number>(0);
  const webrtcService = useRef(new WebRTCService()).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const connectSocket = async () => {
      socketService.connect();
    };
    
    connectSocket();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRingtone();
      webrtcService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'incoming') {
      playRingtone();
    }
  }, [callStatus]);

  const startCall = async () => {
    try {
      const roomId = callId;
      
      await webrtcService.initialize(roomId, (remoteStream) => {
        // Remote stream received, user answered
        setCallStatus('connected');
        updateCallStatus(callId, 'ongoing');
        startTimer();
        stopRingtone();
      });
      
      if (isOutgoing) {
        // Create and send offer if this is the caller
        webrtcService.createOffer();
        updateCallStatus(callId, 'initiated');
      } else {
        // Update status to ongoing if this is the receiver accepting the call
        updateCallStatus(callId, 'ongoing');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      endCall();
    }
  };

  const acceptCall = async () => {
    setCallStatus('connecting');
    stopRingtone();
    await startCall();
  };

  const rejectCall = async () => {
    if (callStatus === 'incoming') {
      updateCallStatus(callId, 'rejected');
    }
    stopRingtone();
    endCall();
  };

  const endCall = async () => {
    updateCallStatus(callId, 'completed');
    webrtcService.cleanup();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onEndCall();
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(seconds);
    }, 1000);
  };

  const playRingtone = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/ringtone.mp3')
      );
      ringtoneRef.current = sound;
      await sound.setIsLoopingAsync(true);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  };

  const stopRingtone = async () => {
    if (ringtoneRef.current) {
      await ringtoneRef.current.stopAsync();
      await ringtoneRef.current.unloadAsync();
      ringtoneRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Start call if outgoing
  useEffect(() => {
    if (isOutgoing) {
      startCall();
    }
  }, [isOutgoing]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.callerInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{receiverName.charAt(0)}</Text>
        </View>
        <ThemedText style={styles.callerName}>{receiverName}</ThemedText>
        <ThemedText style={styles.statusText}>
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'incoming' && 'Incoming Call'}
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'connected' && formatTime(callDuration)}
        </ThemedText>
      </View>
      
      <View style={styles.controls}>
        {callStatus === 'incoming' ? (
          // Incoming call controls
          <View style={styles.incomingControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.rejectButton]}
              onPress={rejectCall}
            >
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.acceptButton]}
              onPress={acceptCall}
            >
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          // Call in progress or outgoing call
          <View style={styles.ongoingControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.muteButton]}
            >
              <Ionicons name="mic-off" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.speakerButton]}
            >
              <Ionicons name="volume-high" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.rejectButton]}
              onPress={endCall}
            >
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: 50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  statusText: {
    fontSize: 16,
    marginTop: 10,
    color: '#777',
  },
  controls: {
    marginBottom: 50,
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ongoingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#2ecc71',
    transform: [{ rotate: '0deg' }],
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
    transform: [{ rotate: '135deg' }],
  },
  muteButton: {
    backgroundColor: '#7f8c8d',
  },
  speakerButton: {
    backgroundColor: '#3498db',
  },
});

export default UserCallScreen; 
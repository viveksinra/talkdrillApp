import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import WebRTCService from '../../../api/services/webrtcService';
import socketService from '../../../api/services/socketService';
import { updateCallStatus } from '../../../api/services/callService';
import {ThemedView} from '../../ThemedView';
import {ThemedText} from '../../ThemedText';

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
  const localStream = useRef<MediaStream | null>(null);
  const isMuted = useRef<boolean>(false);
  const isSpeakerOn = useRef<boolean>(true);

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
        localStream.current = remoteStream;
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

  const handleToggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track: any) => {
        track.enabled = isMuted.current;
      });
      isMuted.current = !isMuted.current;
    }
  };
  
  const handleToggleSpeaker = async () => {
    isSpeakerOn.current = !isSpeakerOn.current;
    
    // Update audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: isSpeakerOn.current, // Toggle the current value
    });
  };
  
  const handleEndCall = async () => {
    try {
      endCall();
      onEndCall();
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start call if outgoing
  useEffect(() => {
    if (isOutgoing) {
      startCall();
    }
  }, [isOutgoing]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>{receiverName}</ThemedText>
        {callStatus === 'connected' ? (
          <ThemedText style={styles.callTime}>{formatTime(callDuration)}</ThemedText>
        ) : (
          <ThemedText style={styles.callStatus}>
            {callStatus === 'calling' ? 'Calling...' : 'Incoming call...'}
          </ThemedText>
        )}
      </View>
      
      <View style={styles.avatar}>
        <View style={styles.avatarCircle}>
          <ThemedText style={styles.avatarText}>
            {receiverName.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, isMuted.current && styles.activeButton]} 
          onPress={handleToggleMute}
          disabled={callStatus !== 'connected'}
        >
          <Ionicons name={isMuted.current ? "mic-off" : "mic"} size={24} color="white" />
          <ThemedText style={styles.buttonText}>Mute</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.endCallButton} 
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={24} color="white" />
          <ThemedText style={styles.buttonText}>End Call</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, isSpeakerOn.current && styles.activeButton]} 
          onPress={handleToggleSpeaker}
          disabled={callStatus !== 'connected'}
        >
          <Ionicons name="volume-high" size={24} color="white" />
          <ThemedText style={styles.buttonText}>Speaker</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D3D47',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  callTime: {
    fontSize: 16,
    color: '#A1CEDC',
    marginTop: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#A1CEDC',
    marginTop: 8,
  },
  avatar: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4A86E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#4A86E8',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserCallScreen; 
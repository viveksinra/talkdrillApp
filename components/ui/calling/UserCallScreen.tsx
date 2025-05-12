import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import streamService from '../../../api/services/streamService';
import { updateCallStatus } from '../../../api/services/callService';
import { ThemedView } from '../../ThemedView';
import { ThemedText } from '../../ThemedText';
import { 
  StreamVideoClient, 
  StreamVideo, 
  StreamCall, 
  Call
} from '@stream-io/video-react-native-sdk';

interface UserCallScreenProps {
  callId: string;
  callerId: string;
  receiverId: string;
  receiverName: string;
  onEndCall: () => void;
  isOutgoing?: boolean;
  streamCallId?: string;
}

const UserCallScreen: React.FC<UserCallScreenProps> = ({
  callId,
  callerId,
  receiverId,
  receiverName,
  onEndCall,
  isOutgoing = true,
  streamCallId
}) => {
  const [callStatus, setCallStatus] = useState<string>(isOutgoing ? 'calling' : 'incoming');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [streamClient, setStreamClient] = useState<StreamVideoClient | null>(null);
  const [streamCall, setStreamCall] = useState<Call | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const isMuted = useRef<boolean>(false);
  const isSpeakerOn = useRef<boolean>(true);

  // Initialize Stream and join call
  useEffect(() => {
    const initializeStream = async () => {
      try {
        if (isOutgoing || callStatus === 'connecting') {
          // Get token from backend
          const response = await streamService.getToken();
          
          // Initialize Stream client
          const client = await streamService.initialize(
            callerId,
            response.token,
            response.apiKey
          );
          
          setStreamClient(client);
          
          // Start or join call
          if (streamCallId) {
            const call = await streamService.joinCall(streamCallId);
            setStreamCall(call);
            setCallStatus('connected');
            updateCallStatus(callId, 'ongoing');
            startTimer();
          } else if (isOutgoing) {
            // Create a new call
            const { streamCallId: newStreamCallId } = await streamService.startCall(receiverId);
            const call = streamService.getCall();
            setStreamCall(call);
            updateCallStatus(callId, 'initiated');
          }
        }
      } catch (error) {
        console.error('Error initializing Stream for call:', error);
        endCall();
      }
    };
    
    if (isOutgoing || callStatus === 'connecting') {
      initializeStream();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRingtone();
      streamService.cleanup();
    };
  }, [isOutgoing, callStatus]);

  useEffect(() => {
    if (callStatus === 'incoming') {
      playRingtone();
    }
  }, [callStatus]);

  const acceptCall = async () => {
    setCallStatus('connecting');
    stopRingtone();
    // The Stream initialization will happen in the useEffect that watches for callStatus changes
  };

  const rejectCall = async () => {
    if (callStatus === 'incoming') {
      updateCallStatus(callId, 'rejected');
    }
    stopRingtone();
    endCall();
  };

  const endCall = async () => {
    try {
      updateCallStatus(callId, 'completed');
      await streamService.endCall();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      onEndCall();
    } catch (err) {
      console.error('Failed to end call:', err);
      onEndCall();
    }
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

  const handleToggleMute = async () => {
    try {
      await streamService.toggleMicrophone();
      isMuted.current = !isMuted.current;
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };
  
  const handleToggleSpeaker = async () => {
    isSpeakerOn.current = !isSpeakerOn.current;
    
    // Update audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: !isSpeakerOn.current,
    });
  };
  
  const handleEndCall = async () => {
    try {
      await endCall();
    } catch (err) {
      console.error('Failed to end call:', err);
      onEndCall();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallUI = () => {
    // If we have a Stream call and client, render the Stream UI
    if (streamClient && streamCall && callStatus === 'connected') {
      return (
        <StreamVideo client={streamClient}>
          <StreamCall call={streamCall}>
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>{receiverName}</ThemedText>
              <ThemedText style={styles.callTime}>{formatTime(callDuration)}</ThemedText>
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
              >
                <Ionicons name="volume-high" size={24} color="white" />
                <ThemedText style={styles.buttonText}>Speaker</ThemedText>
              </TouchableOpacity>
            </View>
          </StreamCall>
        </StreamVideo>
      );
    }
    
    // Otherwise show the calling/incoming UI
    return (
      <>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>{receiverName}</ThemedText>
          <ThemedText style={styles.callStatus}>
            {callStatus === 'calling' ? 'Calling...' : 'Incoming call...'}
          </ThemedText>
        </View>
        
        <View style={styles.avatar}>
          <View style={styles.avatarCircle}>
            <ThemedText style={styles.avatarText}>
              {receiverName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.controls}>
          {callStatus === 'incoming' ? (
            <>
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: '#4CAF50' }]} 
                onPress={acceptCall}
              >
                <Ionicons name="call" size={24} color="white" />
                <ThemedText style={styles.buttonText}>Accept</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.endCallButton} 
                onPress={rejectCall}
              >
                <Ionicons name="call" size={24} color="white" />
                <ThemedText style={styles.buttonText}>Reject</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.endCallButton} 
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={24} color="white" />
              <ThemedText style={styles.buttonText}>End Call</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {renderCallUI()}
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
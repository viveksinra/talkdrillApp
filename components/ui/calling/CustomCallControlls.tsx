import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallStateHooks, useCall } from '@stream-io/video-react-native-sdk';
import { Colors } from '@/constants/Colors';

export const CustomCallControls = () => {
  const { useCameraState, useMicrophoneState, useScreenShareState } = useCallStateHooks();
  const { camera, isMute: isCameraMute } = useCameraState();
  const { microphone, isMute: isMicMute } = useMicrophoneState();
  const { screenShare, status: screenShareStatus } = useScreenShareState();
  const call = useCall();

  const handleEndCall = async () => {
    if (call) {
      await call.endCall();
    }
  };

  const handleToggleMicrophone = async () => {
    await microphone.toggle();
  };

  const handleToggleCamera = async () => {
    await camera.toggle();
  };

  const handleFlipCamera = async () => {
    await camera.flip();
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsContainer}>
        {/* Microphone Toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: isMicMute ? Colors.light.error : Colors.light.surface }
          ]}
          onPress={handleToggleMicrophone}
        >
          <Ionicons 
            name={isMicMute ? 'mic-off' : 'mic'} 
            size={24} 
            color={isMicMute ? Colors.light.background : Colors.light.text} 
          />
        </TouchableOpacity>

        {/* Camera Toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: isCameraMute ? Colors.light.error : Colors.light.surface }
          ]}
          onPress={handleToggleCamera}
        >
          <Ionicons 
            name={isCameraMute ? 'videocam-off' : 'videocam'} 
            size={24} 
            color={isCameraMute ? Colors.light.background : Colors.light.text} 
          />
        </TouchableOpacity>

        {/* Camera Flip */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: Colors.light.surface }]}
          onPress={handleFlipCamera}
        >
          <Ionicons 
            name="camera-reverse" 
            size={24} 
            color={Colors.light.text} 
          />
        </TouchableOpacity>

        {/* End Call */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endButton]}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={24} color={Colors.light.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
  },
  endButton: {
    backgroundColor: Colors.light.error,
  },
});

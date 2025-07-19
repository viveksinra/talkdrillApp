import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, TextInput, ActivityIndicator, Text, StyleSheet, Platform, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { LoadingDots } from '../../shared/LoadingDot';

interface CallControlsProps {
  isFullScreen: boolean;
  renderMode: "video" | "chat";
  textMessage: string;
  setTextMessage: (text: string) => void;
  sendTextMessage: () => void;
  isRecording: boolean;
  toggleRecording: () => void;
  isConnected: boolean;
  isProcessingVoice: boolean;
  isGeneratingText: boolean;
  isAIResponding: boolean;
  isAudioPlaying: boolean;
  handleEndCall: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isFullScreen,
  renderMode,
  textMessage,
  setTextMessage,
  sendTextMessage,
  isRecording,
  toggleRecording,
  isConnected,
  isProcessingVoice,
  isGeneratingText,
  isAIResponding,
  isAudioPlaying,
  handleEndCall
}) => {
  // Animation for the pulsing effect - only for shadow
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Start pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isRecording) {
            pulse();
          }
        });
      };
      pulse();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording, pulseAnimation]);

  return (
    <View style={[
      styles.container,
      isFullScreen && styles.fullScreenControls
    ]}>
      {/* Show text input only in chat mode and not in full screen */}
      {renderMode === "chat" && !isFullScreen && (
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            value={textMessage}
            onChangeText={setTextMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !textMessage.trim() && styles.disabledSendButton
            ]}
            onPress={sendTextMessage}
            disabled={!textMessage.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.recordButtonContainer}>
        {/* Animated shadow for recording state - positioned absolutely */}
        {isRecording && (
          <Animated.View
            style={[
              styles.recordButtonShadow,
              {
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          />
        )}
        
        {/* Record button - fixed position */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton,
            (isAIResponding || isAudioPlaying) && !isRecording && styles.interruptModeButton,
            !isConnected && styles.disabledButton,
          ]}
          onPress={toggleRecording}
          disabled={!isConnected}
        >
          <Ionicons 
            name={isRecording ? "pause" : "mic"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
        
        {/* Status text with dots animation for voice processing */}
        {/* {isProcessingVoice && (
          <View style={styles.processingVoiceContainer}>
            <LoadingDots />
          </View>
        )} */}
        
        
        {/* Status text based on recording state - removed recording text */}
        {/* {!isRecording && !isProcessingVoice && !isGeneratingText && (
          <Text style={styles.tapToRecordText}>Tap to record</Text>
        )} */}
      </View>

      {!isFullScreen && (
        <View style={styles.endCallContainer}>
          <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
            <Ionicons name="call" size={24} color="white" />
          </TouchableOpacity>
          {/* <Text style={styles.tapToRecordText}></Text> */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    alignItems: "center", // Changed from "flex-end" to "center"
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
    minHeight: 50, // Reduced from 60 to 50 to match button heights
    position: "relative",
  },
  fullScreenControls: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    transform: [{ translateX: -25 }],
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
    width: 50,
    height: 50,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 120,
    minHeight: Platform.OS === 'ios' ? 60 : 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textInput: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    color: Colors.light.text,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 36,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  disabledSendButton: {
    backgroundColor: "#CCCCCC",
  },
  recordButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flex: 0,
    zIndex: 1000,
    width: 50,
    height: 50,
  },
  recordButtonShadow: {
    position: "absolute",
    top: -10,
    left: -10,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(76, 175, 80, 0.3)",
    zIndex: -1,
  },
  recordButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  recordingButton: {
    backgroundColor: "#4CAF50",
  },
  interruptModeButton: {
    backgroundColor: "#FF9800", // Orange color for interrupt mode
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  processingVoiceContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  recordingStatusText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: "center",
  },
  tapToRecordText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  endCallContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flex: 0,
    zIndex: 1000,
    width: 50,
    height: 50,
  },
  endCallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.error,
    justifyContent: "center",
    alignItems: "center",
  },
});

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
  startRecording: () => void;
  stopRecording: () => void;
  isConnected: boolean;
  isProcessingVoice: boolean;
  isGeneratingText: boolean;
  handleEndCall: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isFullScreen,
  renderMode,
  textMessage,
  setTextMessage,
  sendTextMessage,
  isRecording,
  startRecording,
  stopRecording,
  isConnected,
  isProcessingVoice,
  isGeneratingText,
  handleEndCall
}) => {
  // Animation for the pulsing effect
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipAnimation = useRef(new Animated.Value(0)).current;

  // Start pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
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

  // Tooltip animation
  useEffect(() => {
    if (showTooltip) {
      Animated.timing(tooltipAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(tooltipAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showTooltip, tooltipAnimation]);

  const handlePressIn = () => {
    // Clear any existing timeouts
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Set a timeout to distinguish between tap and hold
    pressTimeoutRef.current = setTimeout(() => {
      // This is a long press, start recording
      startRecording();
    }, 150); // 150ms delay to distinguish tap from hold
  };

  const handlePressOut = () => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }

    if (isRecording) {
      // If recording, stop it
      stopRecording();
    } else {
      // This was a quick tap, show tooltip
      showTooltipBriefly();
    }
  };

  const showTooltipBriefly = () => {
    if (!isConnected) return;
    
    setShowTooltip(true);
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 2000); // Show for 2 seconds
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

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
        {/* Tooltip */}
        {showTooltip && (
          <Animated.View
            style={[
              styles.tooltip,
              {
                opacity: tooltipAnimation,
                transform: [
                  {
                    translateY: tooltipAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.tooltipText}>
              Press and hold the microphone button to record your voice. Your recording will be sent automatically upon release.
            </Text>
            <View style={styles.tooltipArrow} />
          </Animated.View>
        )}

        {/* Animated shadow for recording state */}
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
        
        <Pressable
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton,
            !isConnected && styles.disabledButton,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!isConnected}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={24} 
            color="white" 
          />
        </Pressable>
        
        {/* Status text with dots animation for voice processing */}
        {isProcessingVoice && (
          <View style={styles.processingVoiceContainer}>
            <LoadingDots />
          </View>
        )}
        {isGeneratingText && (
          <Text style={styles.recordingStatusText}>Generating response...</Text>
        )}
        
        {/* Hold to record instruction */}
        {!isRecording && !isProcessingVoice && !isGeneratingText && (
          <Text style={styles.holdToRecordText}>Hold to record</Text>
        )}
        {isRecording && (
          <Text style={styles.recordingText}>Release to send</Text>
        )}
      </View>

      {!isFullScreen && (
        <View style={styles.endCallContainer}>
          <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
            <Ionicons name="call" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.holdToRecordText}></Text>
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
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
    minHeight: 60,
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
    position: "relative",
    flex: 0,
    zIndex: 1000,
  },
  tooltip: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 240,
    zIndex: 2000,
  },
  tooltipText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    lineHeight: 16,
  },
  tooltipArrow: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    transform: [{ translateX: -6 }],
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "white",
  },
  recordButtonShadow: {
    position: "absolute",
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
  holdToRecordText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  recordingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "600",
  },
  endCallContainer: {
    alignItems: "center",
    flex: 0,
  },
  endCallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
  },
});
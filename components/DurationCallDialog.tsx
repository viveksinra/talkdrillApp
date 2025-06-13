import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';
import callService from '@/api/services/callService';
import streamService from '@/api/services/streamService';

interface DurationCallDialogProps {
  visible: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  onCallStarted: (callData: any) => void;
}

export default function DurationCallDialog({
  visible,
  onClose,
  receiverId,
  receiverName,
  onCallStarted
}: DurationCallDialogProps) {
  const [duration, setDuration] = useState('30');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartCall = async () => {
    const durationNum = parseInt(duration);
    
    if (!durationNum || durationNum < 1 || durationNum > 120) {
      Alert.alert('Invalid Duration', 'Please enter a duration between 1 and 120 minutes.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Start call with duration
      const response = await callService.startCallWithDuration(receiverId, durationNum);
      
      if (response.variant === 'success') {
        onCallStarted({
          ...response.myData,
          durationInMinutes: durationNum,
          receiverName
        });
        onClose();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      console.error('Error starting duration call:', error);
      Alert.alert(
        'Call Failed',
        error.response?.data?.message || 'Failed to start call with duration limit'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const presetDurations = [15, 30, 60, 90];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ThemedView style={styles.dialog}>
          <ThemedText style={styles.title}>Call with Time Limit</ThemedText>
          <ThemedText style={styles.subtitle}>
            Calling {receiverName}
          </ThemedText>
          
          <ThemedText style={styles.label}>Duration (minutes):</ThemedText>
          
          {/* Preset duration buttons */}
          <View style={styles.presetContainer}>
            {presetDurations.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  duration === preset.toString() && styles.presetButtonActive
                ]}
                onPress={() => setDuration(preset.toString())}
              >
                <ThemedText style={[
                  styles.presetButtonText,
                  duration === preset.toString() && styles.presetButtonTextActive
                ]}>
                  {preset}min
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Custom duration input */}
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="Enter custom duration"
            keyboardType="numeric"
            maxLength={3}
          />
          
          <ThemedText style={styles.note}>
            Note: Call will automatically end when time limit is reached. 
            Both participants will receive a 1-minute warning.
          </ThemedText>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={isLoading}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.callButton]} 
              onPress={handleStartCall}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ThemedText style={styles.callButtonText}>Start Call</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  presetButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  presetButtonTextActive: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  note: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  callButton: {
    backgroundColor: Colors.light.primary,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  callButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

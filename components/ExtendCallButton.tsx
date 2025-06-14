import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useCall, useCallStateHooks, OwnCapability } from '@stream-io/video-react-native-sdk';

interface ExtendCallButtonProps {
  durationMinutesToExtend: number;
}

export const ExtendCallButton: React.FC<ExtendCallButtonProps> = ({ 
  durationMinutesToExtend 
}) => {
  const call = useCall();
  const { useCallSettings, useHasPermissions } = useCallStateHooks();
  const settings = useCallSettings();
  const canExtend = useHasPermissions(OwnCapability.UPDATE_CALL_SETTINGS);

  if (!canExtend) {
    return null; // Only show to users who can extend
  }

  const handleExtend = async () => {
    if (!call) return;

    try {
      const currentDuration = settings?.limits?.max_duration_seconds ?? 0;
      const newDuration = currentDuration + (durationMinutesToExtend * 60);

      await call.update({
        settings_override: {
          limits: {
            max_duration_seconds: newDuration,
          },
        },
      });

      Alert.alert(
        'Call Extended',
        `Call extended by ${durationMinutesToExtend} minutes`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error extending call:', error);
      Alert.alert('Error', 'Failed to extend call duration');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleExtend}>
      <Text style={styles.buttonText}>
        +{durationMinutesToExtend} min
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
}); 
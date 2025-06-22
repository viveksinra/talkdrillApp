import { StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';

export default function SessionEndConfirmationScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  
  const handleEndSession = () => {
    router.replace({
      pathname: '/report-loading',
      params: { type }
    });
  };
  
  const handleContinueSession = () => {
    // Go back to the session
    router.back();
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <ThemedView style={styles.container}>
        <ThemedView style={styles.modal}>
          <IconSymbol size={48} name="exclamationmark.triangle.fill" color="#F5A623" />
          <ThemedText type="subtitle" style={styles.title}>End Session?</ThemedText>
          <ThemedText style={styles.description}>
            Ending the session will generate a report with feedback on your conversation.
          </ThemedText>
          
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndSession}>
            <ThemedText style={styles.endButtonText}>End Session & Get Report</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueSession}>
            <ThemedText style={styles.continueButtonText}>Continue Session</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  endButton: {
    backgroundColor: '#FF3B30',
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  endButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#F5F5F5',
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#000',
  },
}); 
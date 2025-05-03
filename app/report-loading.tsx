import { StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ReportLoadingScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  
  useEffect(() => {
    // Mock report generation
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/report-summary',
        params: { type, reportId: '1' }
      });
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#4A86E8" />
        <ThemedText type="subtitle" style={styles.title}>Generating your report...</ThemedText>
        <ThemedText style={styles.description}>
          Our AI is analyzing your conversation to provide personalized feedback.
        </ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ECF3FF',
  },
  title: {
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: '80%',
  },
}); 
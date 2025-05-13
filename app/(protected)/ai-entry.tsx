import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function AIEntryScreen() {
  const router = useRouter();
  
  const handleChatWithAI = () => {
    router.push('/ai-selection?mode=chat');
  };
  
  const handleCallWithAI = () => {
    router.push('/ai-selection?mode=call');
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Practice with AI',
        }}
      />
      <ThemedView style={styles.container}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleChatWithAI}>
          <View style={styles.iconContainer}>
            <IconSymbol size={48} name="message.fill" color="#4A86E8" />
          </View>
          <ThemedText type="subtitle">Chat with AI</ThemedText>
          <ThemedText>Practice your writing and conversation skills</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleCallWithAI}>
          <View style={styles.iconContainer}>
            <IconSymbol size={48} name="phone.fill" color="#4A86E8" />
          </View>
          <ThemedText type="subtitle">Call with AI</ThemedText>
          <ThemedText>Practice your speaking and listening skills</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
}); 
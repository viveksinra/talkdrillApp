import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function PeerEntryScreen() {
  const router = useRouter();
  
  const handleChatWithPeer = () => {
    router.push('/peer-filter?mode=chat');
  };
  
  const handleCallWithPeer = () => {
    router.push('/peer-filter?mode=call');
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Practice with Peers',
        }}
      />
      <ThemedView style={styles.container}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleChatWithPeer}>
          <View style={styles.iconContainer}>
            <IconSymbol size={48} name="bubble.left.and.bubble.right.fill" color="#4A86E8" />
          </View>
          <ThemedText type="subtitle">Chat with a Peer</ThemedText>
          <ThemedText>Practice through text chat with other learners</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleCallWithPeer}>
          <View style={styles.iconContainer}>
            <IconSymbol size={48} name="person.wave.2.fill" color="#4A86E8" />
          </View>
          <ThemedText type="subtitle">Call with a Peer</ThemedText>
          <ThemedText>Practice through voice call with other learners</ThemedText>
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
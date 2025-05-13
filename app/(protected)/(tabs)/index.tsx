import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const headerRight = React.useCallback(() => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <TouchableOpacity onPress={() => router.push('/settings')}>
        <IconSymbol size={24} name="gear" color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/notifications')}>
        <IconSymbol size={24} name="bell.fill" color="#000" />
      </TouchableOpacity>
    </View>
  ), [router]);

  const screenOptions = React.useMemo(() => ({
    headerShown: true,
    title: 'Home',
    headerTransparent: true,
    headerRight
  }), [headerRight]);
  
  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.headerImage}
          />
        }>
        <ThemedView style={styles.greetingContainer}>
          <ThemedText type="title">Hello, {user?.name || 'User'}!</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push('/ai-entry')}>
            <IconSymbol size={40} name="message.fill" color="#4A86E8" />
            <ThemedText type="subtitle">Speak with AI</ThemedText>
            <ThemedText>Practice speaking with our AI assistant</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push('/peer-entry')}>
            <IconSymbol size={40} name="person.2.fill" color="#4A86E8" />
            <ThemedText type="subtitle">Peer Practice</ThemedText>
            <ThemedText>Practice with other language learners</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.recentSection}>
          <ThemedText type="subtitle">Recent Sessions</ThemedText>
          <TouchableOpacity onPress={() => router.push('/session-history')}>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.emptyState}>
          <ThemedText>No recent sessions yet. Start practicing!</ThemedText>
        </ThemedView>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}>
          <IconSymbol size={20} name="arrow.right.square" color="#FFFFFF" />
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  greetingContainer: {
    marginBottom: 24,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#4A86E8',
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#4A86E8',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

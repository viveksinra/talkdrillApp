import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useState } from 'react';

export default function CoinsScreen() {
  const router = useRouter();
  const [coinBalance, setCoinBalance] = useState(100); // Mock coin balance
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Coins',
        }}
      />
      <ThemedView style={styles.container}>
        <ThemedView style={styles.balanceSection}>
          <ThemedText type="defaultSemiBold">Your Balance</ThemedText>
          <View style={styles.balanceDisplay}>
            <IconSymbol size={32} name="bitcoinsign.circle.fill" color="#F5A623" />
            <ThemedText type="title">{coinBalance}</ThemedText>
          </View>
        </ThemedView>
        
        <TouchableOpacity style={styles.checkInBanner}>
          <IconSymbol size={24} name="calendar.badge.plus" color="#4A86E8" />
          <ThemedText>Daily Check-In Bonus</ThemedText>
          <ThemedText type="defaultSemiBold">+10 coins</ThemedText>
        </TouchableOpacity>
        
        <ThemedView style={styles.sectionHeader}>
          <ThemedText type="subtitle">Buy Coins</ThemedText>
        </ThemedView>
        
        <View style={styles.packagesContainer}>
          <TouchableOpacity style={styles.packageCard}>
            <ThemedText type="defaultSemiBold">100 Coins</ThemedText>
            <ThemedText type="subtitle">$0.99</ThemedText>
            <TouchableOpacity style={styles.buyButton}>
              <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.packageCard}>
            <ThemedText type="defaultSemiBold">250 Coins</ThemedText>
            <ThemedText type="subtitle">$1.99</ThemedText>
            <TouchableOpacity style={styles.buyButton}>
              <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.packageCard}>
            <ThemedText type="defaultSemiBold">500 Coins</ThemedText>
            <ThemedText type="subtitle">$3.99</ThemedText>
            <View style={[styles.buyButton, styles.bestValueButton]}>
              <ThemedText style={styles.buyButtonText}>Best Value</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => router.push('/coin-history')}>
          <ThemedText>View Coin History</ThemedText>
          <IconSymbol size={20} name="chevron.right" color="#000" />
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkInBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECF3FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  packagesContainer: {
    marginBottom: 24,
    gap: 16,
  },
  packageCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buyButton: {
    backgroundColor: '#4A86E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bestValueButton: {
    backgroundColor: '#F5A623',
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
}); 
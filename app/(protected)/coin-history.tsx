import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CoinTransaction } from '@/types';

export default function CoinHistoryScreen() {
  const router = useRouter();
  
  // Mock coin transaction data
  const [transactions, setTransactions] = useState<CoinTransaction[]>([
    {
      id: '1',
      userId: 'user1',
      type: 'check-in',
      amount: 10,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      description: 'Daily check-in bonus'
    },
    {
      id: '2',
      userId: 'user1',
      type: 'premium-filter',
      amount: -20,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      description: 'Premium filters for peer matching'
    },
    {
      id: '3',
      userId: 'user1',
      type: 'ai-session',
      amount: -15,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      description: 'AI conversation session'
    },
    {
      id: '4',
      userId: 'user1',
      type: 'purchase',
      amount: 100,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      description: 'Purchased 100 coins package'
    },
    {
      id: '5',
      userId: 'user1',
      type: 'refund',
      amount: 15,
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      description: 'Refund for failed session'
    }
  ]);
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <IconSymbol size={24} name="creditcard.fill" color="#4A86E8" />;
      case 'check-in':
        return <IconSymbol size={24} name="calendar.badge.plus" color="#4CD964" />;
      case 'ai-session':
        return <IconSymbol size={24} name="message.fill" color="#FF3B30" />;
      case 'premium-filter':
        return <IconSymbol size={24} name="slider.horizontal.3" color="#FF3B30" />;
      case 'teacher-session':
        return <IconSymbol size={24} name="person.fill" color="#FF3B30" />;
      case 'refund':
        return <IconSymbol size={24} name="arrow.clockwise" color="#4CD964" />;
      default:
        return <IconSymbol size={24} name="bitcoinsign.circle.fill" color="#F5A623" />;
    }
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const renderTransactionItem = ({ item }: { item: CoinTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {getTransactionIcon(item.type)}
      </View>
      <View style={styles.transactionDetails}>
        <ThemedText type="defaultSemiBold">{item.description}</ThemedText>
        <ThemedText style={styles.timestamp}>{formatDate(item.timestamp)}</ThemedText>
      </View>
      <ThemedText style={[
        styles.transactionAmount,
        item.amount > 0 ? styles.positiveAmount : styles.negativeAmount
      ]}>
        {item.amount > 0 ? '+' : ''}{item.amount}
      </ThemedText>
    </View>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Coin History',
        }}
      />
      <ThemedView style={styles.container}>
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="bitcoinsign.circle" color="#888" />
              <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
            </View>
          }
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  positiveAmount: {
    color: '#4CD964',
  },
  negativeAmount: {
    color: '#FF3B30',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
  },
}); 
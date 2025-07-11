import React, { useState, useEffect, useCallback } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  View,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getCoinHistory, type CoinTransaction } from '@/api/services/coinService';

type TransactionFilter = 'all' | 'earned' | 'spent' | 'purchased' | 'refunded';

export default function CoinHistoryScreen() {
  const router = useRouter();
  
  // State
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  });

  // Load transactions
  const loadTransactions = useCallback(async (page = 1, filterType?: string, reset = false) => {
    if (page === 1) {
      reset ? setRefreshing(true) : setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const filterParam = filterType === 'all' ? undefined : filterType;
      const result = await getCoinHistory(page, 20, filterParam);
      
      if (page === 1) {
        setTransactions(result.transactions);
      } else {
        setTransactions(prev => [...prev, ...result.transactions]);
      }
      
      setPagination({
        currentPage: result.currentPage,
        totalPages: result.pages,
        hasMore: result.currentPage < result.pages
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transaction history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions(1, filter);
  }, [filter, loadTransactions]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    loadTransactions(1, filter, true);
  }, [filter, loadTransactions]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      loadTransactions(pagination.currentPage + 1, filter);
    }
  }, [loadingMore, pagination.hasMore, pagination.currentPage, filter, loadTransactions]);

  // Filter handler
  const handleFilterChange = (newFilter: TransactionFilter) => {
    setFilter(newFilter);
    setTransactions([]);
    setPagination({ currentPage: 1, totalPages: 1, hasMore: false });
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchased':
        return <IconSymbol size={24} name="creditcard.fill" color="#4A86E8" />;
      case 'earned':
        return <IconSymbol size={24} name="gift.fill" color="#4CD964" />;
      case 'spent':
        return <IconSymbol size={24} name="minus.circle.fill" color="#FF3B30" />;
      case 'refunded':
        return <IconSymbol size={24} name="arrow.clockwise" color="#4CD964" />;
      default:
        return <IconSymbol size={24} name="bitcoinsign.circle.fill" color="#F5A623" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get transaction type display name
  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'purchased':
        return 'Purchase';
      case 'earned':
        return 'Earned';
      case 'spent':
        return 'Spent';
      case 'refunded':
        return 'Refund';
      default:
        return 'Transaction';
    }
  };

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: CoinTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {getTransactionIcon(item.type)}
      </View>
      <View style={styles.transactionDetails}>
        <ThemedText type="defaultSemiBold" style={styles.transactionDescription}>
          {item.description}
        </ThemedText>
        <View style={styles.transactionMeta}>
          <ThemedText style={styles.transactionType}>
            {getTransactionTypeName(item.type)}
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {formatDate(item.timestamp)}
          </ThemedText>
        </View>
        {item.session && (
          <ThemedText style={styles.sessionInfo}>
            {item.session.type} with {item.session.peerName || item.session.partner}
          </ThemedText>
        )}
      </View>
      <View style={styles.transactionAmountContainer}>
        <ThemedText style={[
          styles.transactionAmount,
          item.type === 'license_used' 
            ? (item.sessionLicenses > 0 ? styles.positiveAmount : styles.negativeAmount)
            : (item.amount > 0 ? styles.positiveAmount : styles.negativeAmount)
        ]}>
          {item.type === 'license_used' 
            ? `${item.sessionLicenses > 0 ? '+' : ''}${item.sessionLicenses}`
            : `${item.amount > 0 ? '+' : '-'}${item.type === 'purchased' || item.type === 'combo_purchased' ? ` ₹${Math.abs(item.amount/100).toFixed(2)}` : Math.abs(item.amount)}`
          }
        </ThemedText>
        <ThemedText style={styles.balanceText}>
          {item.type === 'license_used' 
            ? `Session Balance: ${item.sessionLicenseBalance}`
            : `Balance: ${item.balance}`
          }
        </ThemedText>
      </View>
    </View>
  );

  // Render filter button
  const renderFilterButton = (filterType: TransactionFilter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => handleFilterChange(filterType)}
    >
      <ThemedText style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  // Render footer
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#F5A623" />
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Transaction History',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5A623" />
          <ThemedText style={styles.loadingText}>Loading transactions...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Transaction History',
        }}
      />
      <ThemedView style={styles.container}>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('earned', 'Earned')}
          {renderFilterButton('spent', 'Spent')}
          {renderFilterButton('purchased', 'Purchased')}
          {renderFilterButton('refunded', 'Refunded')}
        </View>

        {/* Transaction List */}
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#F5A623']}
              tintColor="#F5A623"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol size={64} name="bitcoinsign.circle" color="#E0E0E0" />
              <ThemedText style={styles.emptyTitle}>No transactions yet</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'Your transaction history will appear here'
                  : `No ${filter} transactions found`
                }
              </ThemedText>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#F5A623',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
  },
  sessionInfo: {
    fontSize: 12,
    color: '#4A86E8',
    fontStyle: 'italic',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  positiveAmount: {
    color: '#4CD964',
  },
  negativeAmount: {
    color: '#FF3B30',
  },
  balanceText: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
}); 
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  RefreshControl,
  Alert,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Notification, NotificationCategory } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { getNotificationIcon, getNotificationColor, formatNotificationTime, getPriorityColor } from '@/utils/notifications';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All', icon: 'tray.fill' },
  { key: 'transaction', label: 'Coins', icon: 'bitcoinsign.circle.fill' },
  { key: 'session', label: 'Sessions', icon: 'play.circle.fill' },
  { key: 'social', label: 'Social', icon: 'person.2.fill' },
  { key: 'achievement', label: 'Rewards', icon: 'trophy.fill' },
  { key: 'system', label: 'System', icon: 'gear.circle.fill' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    unreadCounts,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, selectedCategory]);

  const filterNotifications = () => {
    if (selectedCategory === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(
        notifications.filter(notification => notification.category === selectedCategory)
      );
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Handle navigation
      if (notification.actionUrl) {
        // Parse and navigate to the action URL
        const url = notification.actionUrl;
        if (url.startsWith('/')) {
          router.push(url as any);
        }
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleNotificationLongPress = (notification: Notification) => {
    const options = [
      notification.isRead ? 'Mark as Unread' : 'Mark as Read',
      'Delete',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: 1,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            if (notification.isRead) {
              // Mark as unread (would need backend support)
              console.log('Mark as unread - not implemented');
            } else {
              await markAsRead(notification.id);
            }
          } else if (buttonIndex === 1) {
            handleDeleteNotification(notification.id);
          }
        }
      );
    } else {
      Alert.alert(
        'Notification Options',
        'Choose an action',
        [
          {
            text: notification.isRead ? 'Mark as Unread' : 'Mark as Read',
            onPress: async () => {
              if (!notification.isRead) {
                await markAsRead(notification.id);
              }
            }
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDeleteNotification(notification.id)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(notificationId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    const category = selectedCategory === 'all' ? undefined : selectedCategory as NotificationCategory;
    Alert.alert(
      'Mark All as Read',
      `Mark all ${selectedCategory === 'all' ? '' : selectedCategory} notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All as Read',
          onPress: async () => {
            try {
              await markAllAsRead(category);
            } catch (error) {
              Alert.alert('Error', 'Failed to mark notifications as read');
            }
          }
        }
      ]
    );
  };

  const renderCategoryFilter = ({ item }: { item: typeof CATEGORY_FILTERS[0] }) => {
    const isSelected = selectedCategory === item.key;
    const categoryUnreadCount = item.key === 'all' ? unreadCount : (unreadCounts[item.key] || 0);

    return (
      <TouchableOpacity
        style={[styles.categoryFilter, isSelected && styles.selectedCategoryFilter]}
        onPress={() => setSelectedCategory(item.key)}
      >
        <IconSymbol 
          size={20} 
          name={item.icon as any} 
          color={isSelected ? '#FFF' : '#4A86E8'} 
        />
        <ThemedText 
          style={[
            styles.categoryLabel, 
            isSelected && styles.selectedCategoryLabel
          ]}
        >
          {item.label}
        </ThemedText>
        {categoryUnreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <ThemedText style={styles.unreadBadgeText}>
              {categoryUnreadCount > 99 ? '99+' : categoryUnreadCount}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleNotificationLongPress(item)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <IconSymbol 
            size={24} 
            name={getNotificationIcon(item.type) as any} 
            color={getNotificationColor(item.type)} 
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <ThemedText 
              type="defaultSemiBold" 
              style={[styles.notificationTitle, !item.isRead && styles.unreadText]}
            >
              {item.title}
            </ThemedText>
            <View style={styles.notificationMeta}>
              {item.priority !== 'medium' && (
                <View 
                  style={[
                    styles.priorityIndicator, 
                    { backgroundColor: getPriorityColor(item.priority) }
                  ]} 
                />
              )}
              <ThemedText style={styles.timestamp}>
                {formatNotificationTime(new Date(item.createdAt))}
              </ThemedText>
            </View>
          </View>
          <ThemedText 
            style={[styles.notificationMessage, !item.isRead && styles.unreadText]}
            numberOfLines={2}
          >
            {item.message}
          </ThemedText>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol size={48} name="bell.slash.fill" color="#888" />
      <ThemedText style={styles.emptyText}>
        No {selectedCategory === 'all' ? '' : selectedCategory} notifications yet
      </ThemedText>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Back',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/notification-settings' as any)}>
                <IconSymbol size={24} name="gear" color="#4A86E8" />
              </TouchableOpacity>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                  <ThemedText style={styles.markAllText}>Mark All Read</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      <ThemedView style={styles.container}>
        {/* Category Filters */}
        <FlatList
          data={CATEGORY_FILTERS}
          renderItem={renderCategoryFilter}
          keyExtractor={item => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilters}
          style={styles.categoryFiltersList}
        />

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.notificationsList}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refreshNotifications}
                tintColor="#4A86E8"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    color: '#4A86E8',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFiltersList: {
    maxHeight: 60,
  },
  categoryFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    gap: 6,
  },
  selectedCategoryFilter: {
    backgroundColor: '#4A86E8',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A86E8',
  },
  selectedCategoryLabel: {
    color: '#FFF',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  notificationItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unreadNotification: {
    backgroundColor: '#F8FAFF',
    borderLeftColor: '#4A86E8',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    position: 'relative',
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    marginRight: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  notificationMessage: {
    color: '#666',
    lineHeight: 20,
  },
  unreadText: {
    fontWeight: '600',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A86E8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 100,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
}); 
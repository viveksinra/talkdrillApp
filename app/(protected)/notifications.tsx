import React, { useState, useEffect, useCallback } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  RefreshControl,
  Alert,
  ActionSheetIOS,
  Platform,
  SafeAreaView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Notification, NotificationCategory } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { getNotificationIcon, getNotificationColor, formatNotificationTime, getPriorityColor } from '@/utils/notifications';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All', icon: 'tray.fill', color: '#5A67D8' },
  { key: 'transaction', label: 'Coins', icon: 'bitcoinsign.circle.fill', color: '#48BB78' },
  { key: 'session', label: 'Sessions', icon: 'play.circle.fill', color: '#ED8936' },
  { key: 'social', label: 'Social', icon: 'person.2.fill', color: '#38B2AC' },
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
        style={[
          styles.categoryFilter, 
          isSelected && { backgroundColor: item.color }
        ]}
        onPress={() => setSelectedCategory(item.key)}
      >
        <ThemedText 
          style={[
            styles.categoryLabel, 
            isSelected && styles.selectedCategoryLabel
          ]}
        >
          {item.label}
        </ThemedText>
        {categoryUnreadCount > 0 && (
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryBadgeText}>
              {categoryUnreadCount > 99 ? '99+' : categoryUnreadCount}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getNotificationIconAndColor = (type: string, category: string) => {
    switch (category) {
      case 'session':
        return { icon: 'doc.text.fill', color: '#5A67D8', bgColor: '#E6FFFA' };
      case 'transaction':
        return { icon: 'bell.fill', color: '#48BB78', bgColor: '#F0FFF4' };
      case 'social':
        return { icon: 'person.2.fill', color: '#ED8936', bgColor: '#FFFAF0' };
      case 'achievement':
        return { icon: 'chart.line.uptrend.xyaxis', color: '#9F7AEA', bgColor: '#FAF5FF' };
      case 'system':
        return { icon: 'megaphone.fill', color: '#4299E1', bgColor: '#EBF8FF' };
      default:
        return { icon: 'bell.fill', color: '#5A67D8', bgColor: '#E6FFFA' };
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const { icon, color, bgColor } = getNotificationIconAndColor(item.type, item.category);
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleNotificationLongPress(item)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: bgColor }]}>
          <IconSymbol size={24} name={icon as any} color={color} />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <ThemedText 
              style={[
                styles.notificationTitle,
                !item.isRead && styles.unreadTitle
              ]}
              numberOfLines={1}
            >
              {item.title}
            </ThemedText>
            <ThemedText style={styles.timestamp}>
              {formatNotificationTime(new Date(item.createdAt))}
            </ThemedText>
          </View>
          
          <ThemedText 
            style={[
              styles.notificationMessage,
              !item.isRead && styles.unreadMessage
            ]}
            numberOfLines={2}
          >
            {item.message}
          </ThemedText>
        </View>
        
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Back',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/notification-settings' as any)}>
                <IconSymbol size={24} name="gear" color="#5A67D8" />
              </TouchableOpacity>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                  <ThemedText style={styles.markAllText}>Mark all as read</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      
      <ThemedView style={styles.container}>
        {/* Category Filters */}
        <View style={styles.categoryContainer}>
          <FlatList
            data={CATEGORY_FILTERS}
            renderItem={renderCategoryFilter}
            keyExtractor={item => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilters}
          />
        </View>

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
                tintColor="#5A67D8"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol size={48} name="bell.slash.fill" color="#CBD5E0" />
            <ThemedText style={styles.emptyText}>
              No notifications yet
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
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
    color: '#5A67D8',
    fontSize: 16,
    fontWeight: '400',
  },
  categoryContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryFilters: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  selectedCategoryLabel: {
    color: '#FFF',
  },
  categoryBadge: {
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsList: {
    padding: 16,
    gap: 8,
  },
  notificationItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadNotification: {
    backgroundColor: '#EDF2F7',
    borderColor: '#E2E8F0',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: '#1A202C',
  },
  timestamp: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '400',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#4A5568',
    fontWeight: '500',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5A67D8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 100,
  },
  emptyText: {
    color: '#A0AEC0',
    fontSize: 16,
    textAlign: 'center',
  },
}); 
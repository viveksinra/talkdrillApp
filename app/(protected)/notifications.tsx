import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Notification } from '@/types';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      userId: 'user1',
      type: 'report-ready',
      title: 'New Report Available',
      message: 'Your AI conversation report is ready to view.',
      timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      read: false,
      actionLink: '/report/1'
    },
    {
      id: '2',
      userId: 'user1',
      type: 'coin-bonus',
      title: 'Daily Bonus',
      message: 'You received 10 coins for your daily check-in!',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      read: true
    },
    {
      id: '3',
      userId: 'user1',
      type: 'system-announcement',
      title: 'New Feature',
      message: 'Try our new peer matching feature for better language practice!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: false
    }
  ]);
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  const handleDismiss = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, item.read ? styles.readNotification : styles.unreadNotification]}
      onPress={() => handleMarkAsRead(item.id)}>
      <View style={styles.notificationIcon}>
        {item.type === 'report-ready' && (
          <IconSymbol size={24} name="doc.text.fill" color="#4A86E8" />
        )}
        {item.type === 'coin-bonus' && (
          <IconSymbol size={24} name="bitcoinsign.circle.fill" color="#F5A623" />
        )}
        {item.type === 'system-announcement' && (
          <IconSymbol size={24} name="megaphone.fill" color="#FF3B30" />
        )}
      </View>
      <View style={styles.notificationContent}>
        <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
        <ThemedText>{item.message}</ThemedText>
        <ThemedText style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
      <TouchableOpacity onPress={() => handleDismiss(item.id)}>
        <IconSymbol size={20} name="xmark" color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Back',
        }}
      />
      <ThemedView style={styles.container}>
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol size={48} name="bell.slash.fill" color="#888" />
            <ThemedText style={styles.emptyText}>No notifications yet</ThemedText>
          </View>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    gap: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  unreadNotification: {
    backgroundColor: '#ECF3FF',
  },
  readNotification: {
    backgroundColor: '#F5F5F5',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#888',
  },
}); 
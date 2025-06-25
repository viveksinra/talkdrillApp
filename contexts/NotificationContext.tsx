import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import notificationService from '@/api/services/notificationService';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { Notification, NotificationPreferences } from '@/types';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  unreadCounts: Record<string, number>;
  preferences: NotificationPreferences | null;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (category?: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket, on, off } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize push notifications
  useEffect(() => {
    if (user?.id) {
      initializePushNotifications();
      loadPreferences();
      refreshNotifications();
    }
  }, [user?.id]);

  // Set up real-time notification listener
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification: Notification) => {
        console.log('New real-time notification received:', notification);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        
        // Update unread counts
        if (!notification.isRead) {
          setUnreadCount(prev => prev + 1);
          setUnreadCounts(prev => ({
            ...prev,
            [notification.category]: (prev[notification.category] || 0) + 1
          }));
        }

        // Show local notification if app is in foreground
        if (AppState.currentState === 'active') {
          Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.message,
              data: notification.data,
            },
            trigger: null,
          });
        }
      };

      on('new_notification', handleNewNotification);
      
      return () => {
        off('new_notification', handleNewNotification);
      };
    }
  }, [socket, on, off]);

  // Set up notification handlers
  useEffect(() => {
    const handleNotificationReceived = (notification: Notifications.Notification) => {
      console.log('Push notification received:', notification);
    };

    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification data
      if (data?.actionUrl) {
        console.log('Navigate to:', data.actionUrl);
        // Add your navigation logic here
      }
    };

    const notificationListener = Notifications.addNotificationReceivedListener(handleNotificationReceived);
    const responseListener = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        Notifications.setBadgeCountAsync(0);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializePushNotifications = async () => {
    try {
      console.log('Initializing push notifications...');
      const token = await registerForPushNotificationsAsync();
      
      if (token && user?.id) {
        console.log('Registering device token with backend:', token.substring(0, 20) + '...');
        
        // Register token with backend using new API
        await notificationService.registerDeviceToken({
          token,
          platform: Platform.OS as 'ios' | 'android',
          deviceId: Device.osInternalBuildId || Device.modelId || `${Platform.OS}-${Date.now()}`
        });
        
        console.log('Device token registered successfully');
      } else {
        console.warn('Failed to get push token or user not logged in');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Set default preferences if loading fails
      setPreferences({
        pushNotifications: true,
        categories: {
          transaction: true,
          session: true,
          system: true,
          social: true,
          achievement: true
        }
      });
    }
  };

  const refreshNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(1, 50);
      
      setNotifications(data.notifications);
      setUnreadCount(data.totalUnreadCount);
      setUnreadCounts(data.unreadCounts);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread counts
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setUnreadCounts(prev => ({
          ...prev,
          [notification.category]: Math.max(0, (prev[notification.category] || 0) - 1)
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async (category?: string) => {
    try {
      await notificationService.markAllAsRead(category);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          (!category || notification.category === category)
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread counts
      if (category) {
        setUnreadCounts(prev => ({ ...prev, [category]: 0 }));
      } else {
        setUnreadCount(0);
        setUnreadCounts({});
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread counts if notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setUnreadCounts(prev => ({
          ...prev,
          [notification.category]: Math.max(0, (prev[notification.category] || 0) - 1)
        }));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const updatedPreferences = await notificationService.updatePreferences(newPreferences);
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadCounts,
        preferences,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
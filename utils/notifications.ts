import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const projectId = '876a21ed-67e6-4c62-8c9b-b4febdf2bfb3'; // Your EAS project ID
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo push token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'report_ready':
      return 'doc.text.fill';
    case 'coin_bonus':
    case 'coin_purchase':
      return 'bitcoinsign.circle.fill';
    case 'coin_low_balance':
      return 'exclamationmark.triangle.fill';
    case 'peer_request':
    case 'peer_matched':
      return 'person.2.fill';
    case 'session_started':
      return 'play.circle.fill';
    case 'session_ended':
      return 'checkmark.circle.fill';
    case 'call_incoming':
      return 'phone.fill';
    case 'call_ended':
      return 'phone.down.fill';
    case 'achievement_unlocked':
      return 'trophy.fill';
    case 'daily_streak':
      return 'flame.fill';
    case 'maintenance':
      return 'wrench.fill';
    case 'feature_announcement':
      return 'sparkles';
    default:
      return 'bell.fill';
  }
}

export function getNotificationColor(type: string): string {
  switch (type) {
    case 'report_ready':
      return '#4A86E8';
    case 'coin_bonus':
    case 'coin_purchase':
      return '#F5A623';
    case 'coin_low_balance':
      return '#FF9500';
    case 'peer_request':
    case 'peer_matched':
      return '#34C759';
    case 'session_started':
      return '#007AFF';
    case 'session_ended':
      return '#34C759';
    case 'call_incoming':
      return '#FF3B30';
    case 'call_ended':
      return '#8E8E93';
    case 'achievement_unlocked':
      return '#FFD60A';
    case 'daily_streak':
      return '#FF6B35';
    case 'maintenance':
      return '#8E8E93';
    case 'feature_announcement':
      return '#AF52DE';
    default:
      return '#007AFF';
  }
}

export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#FF3B30';
    case 'high':
      return '#FF9500';
    case 'medium':
      return '#007AFF';
    case 'low':
      return '#8E8E93';
    default:
      return '#007AFF';
  }
}
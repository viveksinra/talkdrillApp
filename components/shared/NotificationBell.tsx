import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationBellProps {
  color?: string;
  size?: number;
}

export function NotificationBell({ color = '#4A86E8', size = 24 }: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <IconSymbol size={size} name="bell.fill" color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'top',
    lineHeight: 16,
  },
}); 
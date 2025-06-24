import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  View, 
  Alert,
  ScrollView 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPreferences } from '@/types';

const CATEGORY_SETTINGS = [
  {
    key: 'transaction',
    title: 'Coin & Payments',
    description: 'Coin purchases, bonuses, and payment notifications',
    icon: 'bitcoinsign.circle.fill',
    color: '#F5A623'
  },
  {
    key: 'session',
    title: 'Sessions & Reports',
    description: 'Session updates, report completions, and reminders',
    icon: 'play.circle.fill',
    color: '#4A86E8'
  },
  {
    key: 'social',
    title: 'Social & Matching',
    description: 'Peer requests, matches, and calls',
    icon: 'person.2.fill',
    color: '#34C759'
  },
  {
    key: 'achievement',
    title: 'Achievements & Streaks',
    description: 'Daily streaks, achievements, and rewards',
    icon: 'trophy.fill',
    color: '#FFD60A'
  },
  {
    key: 'system',
    title: 'System & Updates',
    description: 'App updates, maintenance, and announcements',
    icon: 'gear.circle.fill',
    color: '#8E8E93'
  }
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleTogglePushNotifications = async (value: boolean) => {
    if (!localPreferences) return;

    try {
      setSaving(true);
      const updatedPrefs = {
        ...localPreferences,
        pushNotifications: value
      };
      
      setLocalPreferences(updatedPrefs);
      await updatePreferences({ pushNotifications: value });
      
      console.log('Push notifications updated successfully');
    } catch (error) {
      console.error('Error updating push notifications:', error);
      Alert.alert('Error', `Failed to update notification settings: ${(error as Error).message || 'Unknown error'}`);
      // Revert local state
      setLocalPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategory = async (category: string, value: boolean) => {
    if (!localPreferences) return;

    try {
      setSaving(true);
      const updatedCategories = {
        ...localPreferences.categories,
        [category]: value
      };
      
      const updatedPrefs = {
        ...localPreferences,
        categories: updatedCategories
      };
      
      setLocalPreferences(updatedPrefs);
      await updatePreferences({ categories: updatedCategories });
      
      console.log(`Category ${category} updated successfully`);
    } catch (error) {
      console.error('Error updating category settings:', error);
      Alert.alert('Error', `Failed to update ${category} settings: ${(error as Error).message || 'Unknown error'}`);
      // Revert local state
      setLocalPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'This feature will send a test notification to verify your settings are working correctly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test',
          onPress: () => {
            // This would trigger a test notification from the backend
            Alert.alert('Test Sent', 'Check for the test notification!');
          }
        }
      ]
    );
  };

  if (!localPreferences) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading settings...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notification Settings',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container}>
        <ThemedView style={styles.content}>
          {/* Main Toggle */}
          <View style={styles.section}>
            <View style={styles.mainToggle}>
              <View style={styles.toggleHeader}>
                <IconSymbol size={24} name="bell.fill" color="#4A86E8" />
                <View style={styles.toggleText}>
                  <ThemedText type="defaultSemiBold">Push Notifications</ThemedText>
                  <ThemedText style={styles.toggleDescription}>
                    Receive notifications when the app is closed
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={localPreferences.pushNotifications}
                onValueChange={handleTogglePushNotifications}
                disabled={saving}
                trackColor={{ false: '#E5E5EA', true: '#4A86E8' }}
                thumbColor={localPreferences.pushNotifications ? '#FFF' : '#FFF'}
              />
            </View>
          </View>

          {/* Category Settings */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Notification Categories
            </ThemedText>
            
            {CATEGORY_SETTINGS.map((category) => (
              <View key={category.key} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                    <IconSymbol 
                      size={20} 
                      name={category.icon as any} 
                      color={category.color} 
                    />
                  </View>
                  <View style={styles.categoryText}>
                    <ThemedText type="defaultSemiBold">{category.title}</ThemedText>
                    <ThemedText style={styles.categoryDescription}>
                      {category.description}
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={localPreferences.categories[category.key as keyof typeof localPreferences.categories]}
                  onValueChange={(value) => handleToggleCategory(category.key, value)}
                  disabled={saving || !localPreferences.pushNotifications}
                  trackColor={{ false: '#E5E5EA', true: category.color }}
                  thumbColor="#FFF"
                />
              </View>
            ))}
          </View>

          {/* Additional Options */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Additional Options
            </ThemedText>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleTestNotification}
            >
              <View style={styles.optionHeader}>
                <IconSymbol size={20} name="paperplane.fill" color="#4A86E8" />
                <ThemedText type="defaultSemiBold">Send Test Notification</ThemedText>
              </View>
              <IconSymbol size={16} name="chevron.right" color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => Alert.alert('Coming Soon', 'Notification scheduling will be available in a future update.')}
            >
              <View style={styles.optionHeader}>
                <IconSymbol size={20} name="clock.fill" color="#4A86E8" />
                <ThemedText type="defaultSemiBold">Quiet Hours</ThemedText>
              </View>
              <IconSymbol size={16} name="chevron.right" color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <IconSymbol size={20} name="info.circle.fill" color="#8E8E93" />
            <ThemedText style={styles.infoText}>
              Notification settings are synced across all your devices. 
              Some critical notifications like incoming calls cannot be disabled.
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#1C1C1E',
  },
  mainToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleDescription: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    flex: 1,
  },
  categoryDescription: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F2F2F7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
  },
});

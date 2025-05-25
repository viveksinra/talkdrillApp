import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    language: 'English',
    theme: 'Light',
  });
  
  const handleTogglePushNotifications = () => {
    setSettings({
      ...settings,
      pushNotifications: !settings.pushNotifications
    });
  };
  
  const handleLanguageChange = () => {
    // In a real app, show a language picker
    setSettings({
      ...settings,
      language: settings.language === 'English' ? 'Spanish' : 'English'
    });
  };
  
  const handleThemeChange = () => {
    // In a real app, toggle between light and dark modes
    setSettings({
      ...settings,
      theme: settings.theme === 'Light' ? 'Dark' : 'Light'
    });
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
        }}
      />
      <ThemedView style={styles.container}>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/privacy')}>
            <ThemedText>Privacy Policy</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/terms')}>
            <ThemedText>Terms of Service</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/about')}>
            <ThemedText>About TalkDrill</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#888" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  settingsGroup: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
}); 
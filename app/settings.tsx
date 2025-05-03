import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

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
  
  const handleLogout = () => {
    // Mock logout
    router.replace('/login');
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
          <View style={styles.settingItem}>
            <ThemedText>Push Notifications</ThemedText>
            <Switch
              value={settings.pushNotifications}
              onValueChange={handleTogglePushNotifications}
              trackColor={{ false: '#E5E5E5', true: '#A1CEDC' }}
              thumbColor={settings.pushNotifications ? '#4A86E8' : '#fff'}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleLanguageChange}>
            <ThemedText>Language</ThemedText>
            <View style={styles.settingValue}>
              <ThemedText>{settings.language}</ThemedText>
              <IconSymbol size={20} name="chevron.right" color="#888" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleThemeChange}>
            <ThemedText>Theme</ThemedText>
            <View style={styles.settingValue}>
              <ThemedText>{settings.theme}</ThemedText>
              <IconSymbol size={20} name="chevron.right" color="#888" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText>Privacy Policy</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText>Terms of Service</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText>About SpeakUp</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#888" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
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
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  },
}); 
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Icon, useTheme } from '@ui-kitten/components';

const HomeIcon = (props) => (
  <Icon {...props} name='home-outline'/>
);

const CoinIcon = (props) => (
  <Icon {...props} name='credit-card-outline'/>
);

const ProfileIcon = (props) => (
  <Icon {...props} name='person-outline'/>
);

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme['color-primary-500'],
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: theme['background-basic-color-1'],
            borderTopColor: theme['border-basic-color-3'],
          },
          default: {
            backgroundColor: theme['background-basic-color-1'],
            borderTopColor: theme['border-basic-color-3'],
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon width={size} height={size} fill={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coin"
        options={{
          title: 'Coin',
          tabBarIcon: ({ color, size }) => (
            <CoinIcon width={size} height={size} fill={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon width={size} height={size} fill={color} />
          ),
        }}
      />
    </Tabs>
  );
}

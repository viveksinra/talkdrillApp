import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Main layout component with auth provider
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            {/* Public routes */}
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="login-via-mobile" options={{ headerBackTitle: 'Back', headerTitle: 'TalkDril' }} />
            <Stack.Screen name="otp-verification" options={{ headerBackTitle: 'Back', headerTitle: '' }} />
            <Stack.Screen name="welcome-carousel" options={{ headerShown: false }} />
            
            {/* Protected routes */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="account-setup" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
            
            {/* Other protected routes */}
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="ai-entry" options={{ title: 'AI Practice' }} />
            <Stack.Screen name="ai-selection" options={{ title: 'Choose AI Partner' }} />
            <Stack.Screen name="ai-chat" options={{ title: 'Chat with AI' }} />
            <Stack.Screen name="ai-call" options={{ title: 'Call with AI' }} />
            <Stack.Screen name="peer-entry" options={{ title: 'Peer Practice' }} />
            <Stack.Screen name="peer-filter" options={{ title: 'Find Partners' }} />
            <Stack.Screen name="peer-chat" options={{ title: 'Chat with Peer' }} />
            <Stack.Screen name="peer-call" options={{ title: 'Call with Peer' }} />
            <Stack.Screen name="session-end-confirmation" options={{ title: 'Session Complete' }} />
            <Stack.Screen name="report-loading" options={{ title: 'Generating Report' }} />
            <Stack.Screen name="report-summary" options={{ title: 'Session Report' }} />
            <Stack.Screen name="report-detailed" options={{ title: 'Detailed Report' }} />
            <Stack.Screen name="coin-history" options={{ title: 'Coin History' }} />
            <Stack.Screen name="saved-reports" options={{ title: 'Saved Reports' }} />
            <Stack.Screen name="session-history" options={{ title: 'Session History' }} />
          </Stack>
          <StatusBar 
            backgroundColor="#00506C" 
            style={Platform.OS === 'ios' ? 'dark' : 'light'} 
          />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, Platform } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Root Layout Navigator that includes auth checking
function RootLayoutNav() {
  const { isLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A86E8" />
      </View>
    );
  }

  return (
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
        <Stack.Screen name="online-users" options={{ title: 'Online Users', headerBackTitle: 'Back' }} />
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
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
      />
    </ThemeProvider>
  );
}

// Main layout component with auth provider
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <RootLayoutNav />
      </SocketProvider>
    </AuthProvider>
  );
}

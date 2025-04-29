import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';

import { useColorScheme } from '@/hooks/useColorScheme';
import { lightTheme, darkTheme } from '@/constants/theme';
import { IconProvider } from '@/components/UIKittenIcons';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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

  // Fix: ensure we properly set up UI Kitten with the required theme and mapping
  const theme = colorScheme === 'dark' ? eva.dark : eva.light;
  const customTheme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <>
      <IconRegistry icons={IconProvider} />
      <ApplicationProvider 
        {...eva} 
        theme={{...theme, ...customTheme}}
      >
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ApplicationProvider>
    </>
  );
}

import { Stack } from 'expo-router';
import { Slot, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedLayout() {
  const { user } = useAuth();
  
  // If user is not authenticated, redirect to login
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

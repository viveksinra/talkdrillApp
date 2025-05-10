import { Stack } from 'expo-router';
import { Slot, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthLayout() {
  const { user } = useAuth();
  
  // If user is authenticated, redirect to protected area
  if (user) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return <Slot />;
}

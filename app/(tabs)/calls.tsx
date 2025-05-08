import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function CallsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to calls screen
    router.replace('/calls');
  }, []);
  
  return null;
}

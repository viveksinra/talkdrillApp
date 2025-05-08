import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function UsersRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to online users screen
    router.replace('/online-users');
  }, []);
  
  return null;
}

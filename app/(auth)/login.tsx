import { Image, StyleSheet, TouchableOpacity, View, TextInput, Linking } from 'react-native';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  // const handleGoogleSignIn = async () => {
  //  
  // };
  
  const handleLoginViaMobile = () => {
      // In a real app, this would navigate to OTP verification
      router.push({
        pathname: '/login-via-mobile'
      });
  };

  const handleTermsPress = () => {
    router.push('/terms');
  };

  const handlePrivacyPress = () => {
    router.push('/privacy');
  };
  
  return (
    <ThemedView style={styles.container}>
      <Image 
        source={require('@/assets/images/login_banner.jpg')} 
        style={styles.logo} 
      />
      
      <ThemedText type="title" style={styles.title}>Welcome to TalkDrill</ThemedText>
      <ThemedText style={styles.tagline}>Improve your English through conversation</ThemedText>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.mobileButton}
          onPress={handleLoginViaMobile}>
          <IconSymbol size={24} name="phone" color="#FFFFFF" />
          <ThemedText style={styles.mobileButtonText}>Continue with Mobile</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.termsContainer}>
        <ThemedText style={styles.termsText}>
          By continuing, you agree to our {' '}
          <ThemedText style={styles.termsLink} onPress={handleTermsPress}>
            Terms of Service
          </ThemedText>
          {' '} and {' '}
          <ThemedText style={styles.termsLink} onPress={handlePrivacyPress}>
            Privacy Policy
          </ThemedText>
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 50,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    paddingVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 10,
  },
  mobileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C46E9',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  mobileButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  termsContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  termsLink: {
    color: '#4C46E9',
    fontWeight: '500',
  },
}); 
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

const SignInScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMobileLogin = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      // Show validation error
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to OTP verification or directly to app
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to app after successful login
      router.replace('/(tabs)');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar style="light" />
        
        <View style={styles.container}>
          {/* Top Wave Design */}
          <View style={styles.waveContainer}>
            <View style={styles.wave} />
          </View>
          
          {/* Logo and Welcome Text */}
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://i.ibb.co/vQBJj7h/talk-drill-logo.png' }} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>Welcome to TalkDrill</Text>
            <Text style={styles.subtitle}>Continue with your phone or Google</Text>
          </View>
          
          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+1</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#9BA1A6"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.button, phoneNumber.length < 10 && styles.buttonDisabled]}
              onPress={handleMobileLogin}
              disabled={phoneNumber.length < 10 || isLoading}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>Please wait...</Text>
              ) : (
                <Text style={styles.buttonText}>Continue with Phone</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Image 
                source={{ uri: 'https://i.ibb.co/zr28VRy/google-logo.png' }} 
                style={styles.googleIcon} 
                resizeMode="contain"
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  waveContainer: {
    position: 'absolute',
    width: width,
    height: height * 0.25,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    width: width * 2,
    height: height * 0.4,
    top: -height * 0.2,
    left: -width * 0.5,
    backgroundColor: Colors.light.tint,
    borderRadius: height * 0.2,
    transform: [{ scaleX: 1.5 }],
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.15,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E9EAEC',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  countryCode: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: '#E9EAEC',
  },
  countryCodeText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#B3DDE8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9EAEC',
  },
  orText: {
    paddingHorizontal: 16,
    color: Colors.light.icon,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9EAEC',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: 'white',
    marginBottom: 24,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginTop: 'auto',
  },
  footerText: {
    textAlign: 'center',
    color: Colors.light.icon,
    fontSize: 12,
    lineHeight: 18,
  },
  footerLink: {
    color: Colors.light.tint,
    fontWeight: '500',
  },
});

export default SignInScreen;

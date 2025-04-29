import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Input, Button, Text, Layout, useTheme } from '@ui-kitten/components';
import { ColorsConstant } from '../../constants/ColorsConstant';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import talkDrillLogo from '../../assets/images/appLogoAndIcon/talkDrillLogo.png';


const SignInScreen = () => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme ? useColorScheme() : 'light';
  const colors = ColorsConstant[colorScheme] || ColorsConstant.light;
  const theme = useTheme ? useTheme() : {};

  const handleSendOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Handle successful sign in
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    // Google sign-in logic
  };

  return (
    <Layout style={[styles.container, { backgroundColor: colors.background }]}>  
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.logoContainer}>
          <Image
            source={talkDrillLogo}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text category="h4" style={[styles.title, { color: colors.primary }]}>Welcome Back</Text>
          <Text appearance="hint" style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.socialContainer}>
          <Button
            style={[styles.socialButton, { backgroundColor: '#fff', borderColor: colors.primary }]}
            // accessoryLeft={() => (
            //   <Image source={GOOGLE_ICON} style={styles.socialIcon} />
            // )}
            onPress={handleGoogleSignIn}
            status="basic"
            appearance="outline"
          >
            {() => <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Continue with Google</Text>}
          </Button>
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
          <Text appearance="hint" style={styles.dividerText}>or</Text>
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
        </View>

        <View style={styles.formContainer}>
          <Input
            style={styles.input}
            placeholder="Mobile Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            accessoryLeft={() => (
              <MaterialIcons name="phone" size={22} color={colors.icon} style={{ marginRight: 4 }} />
            )}
            disabled={otpSent}
          />
          {otpSent && (
            <Input
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              accessoryLeft={() => (
                <MaterialIcons name="lock" size={22} color={colors.icon} style={{ marginRight: 4 }} />
              )}
            />
          )}
          <Button
            style={styles.button}
            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={loading || (!otpSent && phone.length < 8)}
            status="primary"
          >
            {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 8,
    color: '#687076',
  },
  socialContainer: {
    marginBottom: 16,
    width: '100%',
  },
  socialButton: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2196F3',
    marginBottom: 8,
    height: 48,
    justifyContent: 'center',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#F0F0F0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#687076',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  button: {
    borderRadius: 8,
    height: 48,
    marginTop: 8,
  },
});

export default SignInScreen;

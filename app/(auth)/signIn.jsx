import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Input, Button, Text, Layout, Card, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { ColorsConstant } from '../../constants/ColorsConstant';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import talkDrillLogo from '../../assets/images/appLogoAndIcon/talkDrillLogo.png';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const GoogleIcon = (props) => (
  <FontAwesome name="google" size={18} color={ColorsConstant.light.primary} style={styles.socialButtonIcon} />
);

const PhoneIcon = (props) => (
  <MaterialIcons name="phone-android" size={20} color={props.color} />
);

const BackIcon = (props) => (
  <MaterialIcons {...props} name="arrow-back" size={24} />
);

const SignInScreen = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = ColorsConstant[colorScheme || 'light'];

  const handleSendOtp = () => {
    if (phone.length < 10) return;
    setLoading(true);
    
    // Navigate to OTP verification screen with phone number
    setTimeout(() => {
      setLoading(false);
      router.push({
        pathname: '/(auth)/otpVerification/[phone]', 
        params: { phone: phone }
      });
    }, 800);
  };

  const handleGoogleSignIn = () => {
    // Google sign-in logic
  };

  const goBack = () => {
    router.back();
  };

  const renderBackAction = () => (
    <TopNavigationAction icon={BackIcon} onPress={goBack} />
  );

  return (
    <Layout style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <TopNavigation
        accessoryLeft={renderBackAction}
        style={styles.topNavigation}
      />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.logoContainer}>
          <Image
            source={talkDrillLogo}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text category="h4" style={[styles.title, { color: colors.primary }]}>Welcome to TalkDrill</Text>
          <Text appearance="hint" style={styles.subtitle}>Sign in with your mobile number</Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.formContainer}>
            <Text category="s1" style={styles.formLabel}>Phone Number</Text>
            
            <Input
              style={styles.input}
              placeholder="Enter your mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              accessoryLeft={(props) => <PhoneIcon {...props} color={colors.icon} />}
              size="large"
              maxLength={15}
              disabled={loading}
              caption={phone.length > 0 && phone.length < 10 ? 'Please enter a valid phone number' : ''}
              status={phone.length > 0 && phone.length < 10 ? 'danger' : 'basic'}
            />
            
            <Button
              style={styles.button}
              onPress={handleSendOtp}
              disabled={loading || phone.length < 10}
              status="primary"
            >
              {loading ? 'PROCESSING...' : 'CONTINUE'}
            </Button>
          </View>
        </Card>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
          <Text appearance="hint" style={styles.dividerText}>or continue with</Text>
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
        </View>

        <Button
          style={styles.socialButton}
          appearance="outline"
          accessoryLeft={GoogleIcon}
          onPress={handleGoogleSignIn}
        >
          GOOGLE
        </Button>

        <View style={styles.termsContainer}>
          <Text appearance="hint" style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text status="primary" style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text status="primary" style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNavigation: {
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    padding: 16,
  },
  formLabel: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 24,
    borderRadius: 12,
  },
  button: {
    borderRadius: 12,
    height: 52,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1.5,
  },
  dividerText: {
    marginHorizontal: 16,
    fontWeight: '500',
    fontSize: 14,
  },
  socialButton: {
    borderRadius: 12,
    height: 52,
  },
  socialButtonIcon: {
    marginRight: 10,
  },
  termsContainer: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: 'bold',
  }
});

export default SignInScreen;

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Text, Layout, Button, TopNavigation, TopNavigationAction, Input } from '@ui-kitten/components';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ColorsConstant } from '../../../constants/ColorsConstant';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const inputWidth = width * 0.15;

const BackIcon = (props) => (
  <MaterialIcons {...props} name="arrow-back" size={24} />
);

const EditIcon = (props) => (
  <MaterialIcons {...props} name="edit" size={20} />
);

const OTPVerificationScreen = () => {
  const params = useLocalSearchParams();
  const phone = params.phone || '';
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const [resendActive, setResendActive] = useState(false);
  
  const inputRefs = useRef([]);
  const colorScheme = useColorScheme();
  const colors = ColorsConstant[colorScheme || 'light'];

  // Start timer when component mounts
  useEffect(() => {
    if (timer > 0 && !resendActive) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setResendActive(true);
    }
  }, [timer, resendActive]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    // Only allow numeric input
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus to next input field after filling current one
    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
    
    // Auto submit if all fields are filled
    if (index === 3 && value && newOtp.every(digit => digit !== '')) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (index, e) => {
    // Move to previous input on backspace press if current input is empty
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResendOtp = () => {
    if (!resendActive) return;
    
    setResending(true);
    // Simulate OTP resend
    setTimeout(() => {
      setTimer(30);
      setResendActive(false);
      setResending(false);
      // Clear OTP fields
      setOtp(['', '', '', '']);
      // Focus on first input
      inputRefs.current[0].focus();
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp.some(digit => digit === '')) return;
    
    setLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      setLoading(false);
      // Navigate to next screen after successful verification
      router.push('/(tabs)');
    }, 1200);
  };

  const handleEditPhone = () => {
    router.back();
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
        title={() => (
          <Text category="h6" style={styles.headerTitle}>Verify OTP</Text>
        )}
        style={styles.topNavigation}
      />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.infoContainer}>
          <Text category="h5" style={styles.title}>
            Verification Code
          </Text>
          
          <Text appearance="hint" style={styles.subtitle}>
            We have sent a verification code to
          </Text>
          
          <View style={styles.phoneContainer}>
            <Text category="s1" style={styles.phoneNumber}>
              {phone}
            </Text>
            
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleEditPhone}
              activeOpacity={0.7}
            >
              <EditIcon fill={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={[styles.otpInput, { 
                borderColor: digit ? colors.primary : colors.surface,
                backgroundColor: digit ? colors.surface : 'transparent'
              }]}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={e => handleKeyPress(index, e)}
              keyboardType="number-pad"
              maxLength={1}
              textStyle={styles.otpText}
              autoFocus={index === 0}
              selectTextOnFocus={true}
            />
          ))}
        </View>

        <Button
          style={styles.verifyButton}
          onPress={handleVerifyOtp}
          disabled={loading || otp.some(digit => digit === '')}
          status="primary"
        >
          {loading ? 'VERIFYING...' : 'VERIFY OTP'}
        </Button>

        <View style={styles.resendContainer}>
          {!resendActive ? (
            <Text appearance="hint" style={styles.timerText}>
              Resend OTP in {formatTime(timer)}
            </Text>
          ) : (
            <TouchableOpacity 
              onPress={handleResendOtp}
              disabled={resending || !resendActive}
            >
              <Text 
                status="primary" 
                style={[styles.resendText, { opacity: resending ? 0.5 : 1 }]}
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
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
  headerTitle: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    width: inputWidth,
    height: inputWidth * 1.2,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  otpText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  verifyButton: {
    borderRadius: 12,
    height: 52,
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  timerText: {
    fontSize: 14,
  },
  resendText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default OTPVerificationScreen;

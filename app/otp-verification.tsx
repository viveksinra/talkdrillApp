import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TextInput } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { phoneNumber } = useLocalSearchParams();

  const [otp, setOtp] = useState(["1", "2", "3", "4"]);
  const [timer, setTimer] = useState(30);
  const [isResendActive, setIsResendActive] = useState(false);
  const [isAccountSetUpCompleted, setIsAccountSetUpCompleted] = useState(true);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setIsResendActive(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.charAt(0);
    }
    
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Auto focus next input
    if (text !== '' && index < 3) {
      (inputRefs[index + 1].current as any).focus();
    }
  };
  
  const handleResendOtp = () => {
    if (isResendActive) {
      setTimer(30);
      setIsResendActive(false);
      // Mock OTP resend
      
      // Restart timer
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setIsResendActive(true);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
  };
  
  const handleVerifyOtp = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 4) {
      // Mock OTP verification
      // In a real app, verify with API
      // Mock direct login (simplified for demo)
      login({ name: 'Phone User', phoneNumber: phoneNumber as string });
      if(isAccountSetUpCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/account-setup');
      }
    }
  };
  
  const handleEditNumber = () => {
    router.back();
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Enter verification code</ThemedText>
      
      <View style={styles.phoneNumberContainer}>
        <ThemedText>Code sent to {phoneNumber}</ThemedText>
        <TouchableOpacity onPress={handleEditNumber}>
          <ThemedText style={styles.changeText}>Change</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={inputRefs[index]}
            style={[
              styles.otpInput,
              index === 0 && otp[0] !== '' && styles.activeInput
            ]}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            keyboardType="number-pad"
            maxLength={1}
          />
        ))}
      </View>
      
      <View style={styles.resendContainer}>
        {
          isResendActive ? (
            <TouchableOpacity onPress={handleResendOtp}>
             <ThemedText style={styles.resendButtonText}>Resend code</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedText style={styles.resendText}>
              Resend code in <ThemedText style={styles.timerText}>{timer}s</ThemedText>
            </ThemedText>
          )
        }
      </View>
      
      <TouchableOpacity
        style={[
          styles.verifyButton,
          otp.join('').length < 4 && styles.verifyButtonDisabled
        ]}
        disabled={otp.join('').length < 4}
        onPress={handleVerifyOtp}>
        <ThemedText style={styles.verifyButtonText}>Verify</ThemedText>
      </TouchableOpacity>
      
      <View style={styles.warningContainer}>
        <View style={styles.warningIconContainer}>
          <ThemedText style={styles.warningIcon}>⚠️</ThemedText>
        </View>
        <ThemedText style={styles.warningText}>
          Never share your verification code with anyone else. Our team will never ask for your code.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 32,
    gap: 8,
  },
  changeText: {
    color: '#4A86E8',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 32,
    gap: 16,
  },
  otpInput: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  activeInput: {
    borderColor: '#4A86E8',
    borderWidth: 2,
  },
  verifyButton: {
    backgroundColor: '#7695EC',
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  resendContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  resendText: {
    textAlign: 'center',
    fontSize: 16,
  },
  resendButtonText: {
    color: '#4A86E8',
    fontWeight: '600',
    fontSize: 16,
  },
  timerText: {
    color: '#4A86E8',
    fontWeight: 'bold',
  },
  warningContainer: {
    backgroundColor: '#FFF9E6',
    flexDirection: 'row',
    borderRadius: 8,
    padding: 16,
    marginTop: 48,
    gap: 12,
  },
  warningIconContainer: {
    marginTop: 2,
  },
  warningIcon: {
    fontSize: 18,
    color: '#CD6200',
  },
  warningText: {
    flex: 1,
    color: '#CD6200',
  },
}); 
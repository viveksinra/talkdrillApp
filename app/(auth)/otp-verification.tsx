import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TextInput } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { sendOTP, verifyOTP } from '@/api/services/public/authService';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { phoneNumber } = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [isResendActive, setIsResendActive] = useState(false);
  const [isAccountSetUpCompleted, setIsAccountSetUpCompleted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  
  /**
   * Starts a countdown timer for OTP resend functionality.
   * 
   * @returns {NodeJS.Timeout} An interval timer that can be used to clear the countdown.
   * 
   * This function sets a 30-second countdown timer, disabling OTP resend initially.
   * When the timer reaches zero, it enables the resend option and clears the interval.
   */
  const startOTPTimer = () => {
    setTimer(30);
    setIsResendActive(false);
    
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
    
    return interval;
  };

  /**
   * Initializes the OTP (One-Time Password) process for phone number verification.
   * 
   * @param {boolean} [isResend=false] - Indicates whether this is a resend attempt of the OTP.
   * @returns {() => void} A cleanup function to clear the OTP timer interval.
   * @throws {Error} Throws an error if OTP sending fails, with an alert shown to the user.
   */
  const initializeOTP = async (isResend = false) => {
    try {
      if (isResend) {
        setResendLoading(true);
      }
      
      // Call the API to send OTP
      await sendOTP(phoneNumber as string);
      
      // Start the timer
      const interval = startOTPTimer();
      
      return () => clearInterval(interval);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send OTP. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      if (isResend) {
        setResendLoading(false);
      }
    }
  };
  
  /**
   * Sets up the OTP (One-Time Password) initialization when the component mounts.
   * 
   * This effect triggers the OTP sending process automatically when the component loads,
   * and ensures proper cleanup of the OTP timer interval when the component unmounts.
   * 
   * @returns {void} Cleans up the OTP timer interval to prevent memory leaks.
   */
  useEffect(() => {
    // Send OTP when component mounts
    const cleanupTimer = initializeOTP();
    
    return () => {
      // Handle the Promise returned by initializeOTP
      cleanupTimer.then(cleanup => {
        if (cleanup) cleanup();
      });
    };
  }, []);
  
  /**
   * Handles changes to the OTP (One-Time Password) input fields.
   * 
   * @param {string} text - The input text for the current OTP digit.
   * @param {number} index - The index of the current OTP input field.
   * 
   * Updates the OTP state, limits input to a single character,
   * and automatically focuses the next input field when a digit is entered.
   */
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
  

  /**
   * Handles the resending of the One-Time Password (OTP).
   * 
   * This function triggers the OTP resend process only if the resend functionality is currently active.
   * It calls the initializeOTP method with a flag indicating a resend attempt.
   * 
   * @returns {Promise<void>} A promise that resolves when the OTP resend process is initiated.
   */
  const handleResendOtp = async () => {
    if (isResendActive) {
      initializeOTP(true);
    }
  };
  
  /**
   * Handles the verification of the One-Time Password (OTP).
   * 
   * This function is triggered when the user attempts to verify their OTP:
   * - Checks if a complete 4-digit OTP has been entered
   * - Calls the OTP verification API with the phone number and entered OTP
   * - Logs in the user upon successful verification
   * - Navigates to the main app screen
   * - Handles and displays any verification errors
   * 
   * @async
   * @throws {Error} Throws an error if OTP verification fails
   */
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 4) {
      try {
        setLoading(true);

        // Call the API to verify OTP
        const response = await verifyOTP(phoneNumber as string, enteredOtp);

        // Extract token and user data from response
        const { token, user } = response;

        // Login the user
        await login(token, user);

        // Navigate to the appropriate screen
        // if (!user.isProfileCompleted) {
        //   router.replace('account-setup' as any);
        // } else {
          router.replace('(tabs)' as any);
        // }
      } catch (error) {
        Alert.alert(
          'Error',
          'Failed to verify OTP. Please check the code and try again.',
          [{ text: 'OK' }]
        );
        console.error('Error verifying OTP:', error);
      } finally {
        setLoading(false);
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
              digit !== '' && otp[0] !== '' && styles.activeInput
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
            <TouchableOpacity 
            onPress={handleResendOtp} 
            disabled={resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color="#4A86E8" />
            ) : (
              <ThemedText style={styles.resendButtonText}>Resend code</ThemedText>
            )}
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
          (otp.join('').length < 4 || loading) && styles.verifyButtonDisabled
        ]}
        disabled={otp.join('').length < 4 || loading}
        onPress={handleVerifyOtp}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <ThemedText style={styles.verifyButtonText}>Verify</ThemedText>
        )}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    alignSelf: 'center',
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    gap: 8,
  },
  changeText: {
    color: '#4A86E8',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
import { post } from '@/api/config/axiosConfig';

// API endpoints
const SEND_OTP_ENDPOINT = '/api/v1/auth/send-otp';
const VERIFY_OTP_ENDPOINT = '/api/v1/auth/verify-otp';

/**
 * Send OTP to the provided phone number
 * @param phoneNumber - Phone number with country code (e.g. +91xxxxxxxxxx)
 * @param referralCode - Optional referral code
 * @returns Promise with the API response
 */
export const sendOTP = async (phoneNumber: string, referralCode?: string) => {
  try {
    const payload: any = { phoneNumber };
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim();
    }
    const response = await post(SEND_OTP_ENDPOINT, payload);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

/**
 * Verify the OTP entered by the user
 * @param phoneNumber - Phone number with country code
 * @param otp - The 4-digit OTP entered by the user
 * @returns Promise with the API response including auth token and user data
 */
export const verifyOTP = async (phoneNumber: string, otp: string) => {
  try {
    const response = await post(VERIFY_OTP_ENDPOINT, { phoneNumber, otp });
    console.log('OTP verification response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}; 
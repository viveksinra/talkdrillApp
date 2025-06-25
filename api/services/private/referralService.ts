import { get, post } from '@/api/config/axiosConfig';

// Types
export interface ReferralStats {
  totalReferred: number;
  totalReferralRewards: number;
}

export interface ReferredUser {
  id: string;
  name: string;
  joinedDate: string;
  rewardClaimed: boolean;
}

export interface ReferralInfo {
  referralCode: string;
  referralStats: ReferralStats;
  referredBy?: {
    name: string;
    referralCode: string;
  };
  referredUsers: ReferredUser[];
}

export interface ReferralValidation {
  referrerName: string;
  referralCode: string;
}

// Get user's referral information
export const getReferralInfo = async (): Promise<ReferralInfo> => {
  try {
    const response = await get('/api/v1/referral/info');
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to get referral information');
  } catch (error) {
    console.error('Error getting referral info:', error);
    throw error;
  }
};

// Validate referral code
export const validateReferralCode = async (referralCode: string): Promise<ReferralValidation> => {
  try {
    const response = await post('/api/v1/referral/validate', { referralCode });
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to validate referral code');
  } catch (error) {
    console.error('Error validating referral code:', error);
    throw error;
  }
};

// Check if referral code format is valid (utility function)
export const isValidReferralCodeFormat = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  
  // Check if code is exactly 6 characters and alphanumeric
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(code.toUpperCase());
};

// Generate shareable referral message (utility function)  
export const generateReferralMessage = (referralCode: string): string => {
  return `Join TalkDrill with my referral code ${referralCode} and get 150 bonus coins! Download the app and start improving your English skills today. 🚀✨`;
}; 
import { get, post } from '../config/axiosConfig';

// Types
export interface CoinBalance {
  coins: number;
  userId: string;
}
export interface SessionLicenseBalance {
  sessionLicenses: number;
  userId: string;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent' | 'purchased' | 'refunded' | 'combo_purchased';
  description: string;
  balance: number;
  timestamp: string;
  session?: {
    id: string;
    type: string;
    partner: string;
    peerName?: string;
  };
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  currency: string;
  name: string;
  priceDisplay: string;
  bestValue?: boolean;
  extraPercentage?: number;
}

export interface ComboPackage {
  id: string;
  name: string;
  coins: number;
  sessionLicenses: number;
  sellingPrice: number;
  realPrice: number;
  currency: string;
  priceDisplay: string;
  originalPriceDisplay: string;
  packageType: 'trial' | 'regular';
  eligible?: boolean;
  eligibilityReason?: string;
  bestValue?: boolean;
  extraPercentage?: number;
}

export interface PaymentOrder {
  isFree?: boolean;
  orderId: string;
  amount: number;
  currency: string;
  package: CoinPackage;
  razorpayKeyId: string;
}

export interface DailyCheckInResult {
  coinsEarned: number;
  newBalance: number;
  dailyStreak: number;
  streakBonus: boolean;
  transactionId: string;
  alreadyCheckedIn?: boolean;
}

// Get user's coin balance
export const getCoinBalance = async (): Promise<CoinBalance> => {
  try {
    const response = await get('/api/v1/coin/balance');
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to get coin balance');
  } catch (error) {
    console.error('Error getting coin balance:', error);
    throw error;
  }
};

// Get user's session license balance
export const getSessionLicenseBalance = async (): Promise<SessionLicenseBalance> => {
  try {
    const response = await get('/api/v1/coin/session-license-balance');
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to get session license balance');
  } catch (error) {
    console.error('Error getting session license balance:', error);
    throw error;
  }
};

// Get coin transaction history
export const getCoinHistory = async (page = 1, limit = 20, type?: string) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (type) {
      params.append('type', type);
    }
    
    const response = await get(`/api/v1/coin/history?${params.toString()}`);
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to get transaction history');
  } catch (error) {
    console.error('Error getting transaction history:', error);
    throw error;
  }
};

// Get available coin packages
export const getCoinPackages = async (): Promise<CoinPackage[]> => {
  try {
    const response = await get('/api/v1/coin/packages');
    if (response.data.variant === 'success') {
      return response.data.myData.packages;
    }
    throw new Error(response.data.message || 'Failed to get coin packages');
  } catch (error) {
    console.error('Error getting coin packages:', error);
    throw error;
  }
};

// Get available combo packages
export const getComboPackages = async (): Promise<ComboPackage[]> => {
  try {
    const response = await get('/api/v1/combo-packages');
    if (response.data.variant === 'success') {
      return response.data.myData.packages;
    }
    throw new Error(response.data.message || 'Failed to get combo packages');
  } catch (error) {
    console.error('Error getting combo packages:', error);
    throw error;
  }
};

// Create payment order for coin purchase
export const createPaymentOrder = async (packageId: string): Promise<PaymentOrder> => {
  try {
    const response = await post('/api/v1/coin/create-order', { packageId });
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to create payment order');
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

// Verify payment and add coins
export const verifyPaymentAndAddCoins = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  packageId: string;
}) => {
  try {
    const response = await post('/api/v1/coin/verify-payment', paymentData);
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to verify payment');
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Create payment order for combo purchase
export const createComboPaymentOrder = async (packageId: string): Promise<PaymentOrder> => {
  try {
    const response = await post('/api/v1/combo-packages/create-order', { packageId });
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to create combo payment order');
  } catch (error) {
    console.error('Error creating combo payment order:', error);
    throw error;
  }
};

// Verify combo payment and add coins
export const verifyComboPaymentAndAddCoins = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  packageId: string;
}) => {
  try {
    const response = await post('/api/v1/combo-packages/verify-payment', paymentData);
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to verify combo payment');
  } catch (error) { 
    console.error('Error verifying combo payment:', error);
    throw error;
  }
};

// Daily check-in to earn coins
export const dailyCheckIn = async (): Promise<DailyCheckInResult> => {
  try {
    const response = await post('/api/v1/coin/daily-checkin', {});
    if (response.data.variant === 'success' || response.data.variant === 'info') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to process daily check-in');
  } catch (error) {
    console.error('Error processing daily check-in:', error);
    throw error;
  }
};

// Check if user can afford something (utility function)
export const canAfford = async (requiredCoins: number): Promise<boolean> => {
  try {
    const balance = await getCoinBalance();
    return balance.coins >= requiredCoins;
  } catch (error) {
    console.error('Error checking affordability:', error);
    return false;
  }
}; 
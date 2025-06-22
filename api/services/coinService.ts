import { get, post } from '../config/axiosConfig';

export const getCoinBalance = async () => {
  try {
    const response = await get('/api/v1/coin/balance');
    return response.data;
  } catch (error) {
    console.error('Error getting coin balance:', error);
    throw error;
  }
};

export const getCoinHistory = async () => {
  try {
    const response = await get('/api/v1/coin/history');
    return response.data;
  } catch (error) {
    console.error('Error getting coin history:', error);
    throw error;
  }
}; 
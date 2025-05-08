import { get } from '../config/axiosConfig';

// Get list of all users
export const getUsersList = async () => {
  try {
    const response = await get('/api/v1/user/list');
    return response.data;
  } catch (error) {
    console.error('Error getting users list:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId: string) => {
  try {
    const response = await get(`/api/v1/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

import { get, post, put } from '@/api/config/axiosConfig';

// API endpoints
const CURRENT_USER_ENDPOINT = '/api/v1/auth/current';
const UPDATE_PROFILE_ENDPOINT = '/api/v1/user/update-profile';

/**
 * Get the current user's profile
 * @returns Promise with user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await get(CURRENT_USER_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

/**
 * Update the user's profile information
 * @param userData - Object containing user profile data to update
 * @returns Promise with the updated user data
 */
export const updateUserProfile = async (userData: any) => {
  try {
    const response = await put(UPDATE_PROFILE_ENDPOINT, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 
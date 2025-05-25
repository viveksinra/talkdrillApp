import { get, post, put } from '@/api/config/axiosConfig';

// API endpoints
const CURRENT_USER_ENDPOINT = '/api/v1/auth/current';
const UPDATE_PROFILE_ENDPOINT = '/api/v1/user/profile';
const UPLOAD_IMAGE_ENDPOINT = '/api/v1/other/fileupload/image';

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
 * Upload a profile image to the server
 * @param formData - FormData containing the image
 * @param onProgress - Optional callback function for upload progress
 * @returns Promise with the uploaded image URL
 */
export const uploadImage = async (formData: FormData, onProgress?: (progressEvent: any) => void) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    };
    
    const response = await post(UPLOAD_IMAGE_ENDPOINT, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
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
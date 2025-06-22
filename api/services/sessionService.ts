import { get } from '../config/axiosConfig';

export const getUserSessions = async () => {
  try {
    const response = await get('/api/v1/session/user');
    return response.data;
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
}; 
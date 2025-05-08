import { get, post, put } from '../config/axiosConfig';

// Start a call with AI assistant
export const startAICall = async () => {
  try {
    const response = await post('/api/v1/call/ai', {});
    return response.data;
  } catch (error) {
    console.error('Error starting AI call:', error);
    throw error;
  }
};

// Start a call with another user
export const startUserCall = async (receiverId: string) => {
  try {
    const response = await post('/api/v1/call/user', { receiverId });
    return response.data;
  } catch (error) {
    console.error('Error starting user call:', error);
    throw error;
  }
};

// Update call status
export const updateCallStatus = async (callId: string, status: string) => {
  try {
    const response = await put('/api/v1/call/status', { callId, status });
    return response.data;
  } catch (error) {
    console.error('Error updating call status:', error);
    throw error;
  }
};

// Get call history
export const getCallHistory = async () => {
  try {
    const response = await get('/api/v1/call/history');
    return response.data;
  } catch (error) {
    console.error('Error getting call history:', error);
    throw error;
  }
}; 
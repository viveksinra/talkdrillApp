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

export const joinProfessionalSessionCall = async (bookingId: string) => {
  try {
    const response = await post(`/api/v1/call/professional-session/${bookingId}/join`, {});
    // Return the myData field to match the new backend response format
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to join professional session call');
  } catch (error) {
    console.error('Error joining professional session call:', error);
    throw error;
  }
};

export const startProfessionalSessionRecording = async (bookingId: string) => {
  try {
    const response = await post(`/api/v1/call/professional-session/${bookingId}/start-recording`, {});
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to start recording/transcription');
  } catch (error) {
    console.error('Error starting recording/transcription:', error);
    throw error;
  }
};

export const endProfessionalSessionCall = async (bookingId: string) => {
  try {
    const response = await post(`/api/v1/call/professional-session/${bookingId}/end`, {});
    // Return the myData field to match the new backend response format
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to end professional session call');
  } catch (error) {
    console.error('Error ending professional session call:', error);
    throw error;
  }
};

export interface StartCallWithDurationRequest {
  receiverId: string;
  durationInMinutes: number;
}

export interface StartCallWithDurationResponse {
  message: string;
  variant: string;
  myData: {
    callId: string;
    streamCallId: string;
    callerToken: string;
    receiverToken: string;
    durationInMinutes: number;
  };
}

class CallService {
  // Add this method to existing CallService class or create if it doesn't exist
  
  /**
   * Start a call with duration limit
   */
  async startCallWithDuration(receiverId: string, durationInMinutes: number): Promise<StartCallWithDurationResponse> {
    try {
      const response = await post('/api/v1/call/user-with-duration', {
        receiverId,
        durationInMinutes
      });

      return response.data;
    } catch (error) {
      console.error('Error starting call with duration:', error);
      throw error;
    }
  }

  /**
   * Extend call duration
   */
  async extendCallDuration(callId: string, additionalMinutes: number) {
    try {
      const response = await post('/api/v1/call/extend-duration', {
        callId,
        additionalMinutes
      });

      return response.data;
    } catch (error) {
      console.error('Error extending call duration:', error);
      throw error;
    }
  }
}

export default new CallService(); 
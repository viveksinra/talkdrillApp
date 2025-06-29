import { get, post, put } from '../config/axiosConfig';

export interface WaitingRoomDetails {
  bookingId: string;
  sessionState: string;
  scheduledDate: string;
  scheduledTime: string;
  endTime: string;
  duration: number;
  topic?: string;
  studentNotes?: string;
  streamCallId: string;
  waitingRoomEnabledAt: string;
  participant: {
    role: 'professional';
    name: string;
    profileImage?: string;
    specializations: string[];
    averageRating: number;
  };
}

export interface SessionJoinResponse {
  sessionId: string;
  bookingId: string;
  streamCallId: string;
  streamToken: string;
  userRole: 'student';
  sessionState: string;
  recordingEnabled: boolean;
  participant: {
    name: string;
    profileImage?: string;
  };
}

export interface ChatMessage {
  sender: 'student' | 'professional';
  senderId: string;
  senderType: 'users' | 'professionals';
  message: string;
  messageType: 'text' | 'emoji' | 'system';
  timestamp: string;
  isEdited: boolean;
  editedAt?: string;
}

class ProfessionalSessionService {
  /**
   * Get waiting room details for a booking
   */
  async getWaitingRoomDetails(bookingId: string): Promise<WaitingRoomDetails> {
    try {
      const response = await get(`/api/v1/professional-session/${bookingId}/waiting-room`);
      if (response.data.variant === 'success') {
        return response.data.myData;
      }
      throw new Error(response.data.message || 'Failed to get waiting room details');
    } catch (error) {
      console.error('Error getting waiting room details:', error);
      throw error;
    }
  }

  /**
   * Join professional session call
   */
  async joinSessionCall(bookingId: string): Promise<SessionJoinResponse> {
    try {
      const response = await post(`/api/v1/professional-session/${bookingId}/join`, {});
      if (response.data.variant === 'success') {
        return response.data.myData;
      }
      throw new Error(response.data.message || 'Failed to join session call');
    } catch (error) {
      console.error('Error joining session call:', error);
      throw error;
    }
  }

  /**
   * Handle participant disconnection
   */
  async handleDisconnection(bookingId: string, reason?: string): Promise<{canRejoin: boolean, streamCallId: string}> {
    try {
      const response = await post(`/api/v1/professional-session/${bookingId}/disconnect`, {
        reason: reason || 'connection_lost'
      });
      if (response.data.variant === 'success') {
        return response.data.myData;
      }
      throw new Error(response.data.message || 'Failed to handle disconnection');
    } catch (error) {
      console.error('Error handling disconnection:', error);
      throw error;
    }
  }

  /**
   * End professional session
   */
  async endSession(bookingId: string, endReason: string = 'ended_by_participant'): Promise<{sessionDuration: number, endReason: string, sessionCompleted: boolean}> {
    try {
      const response = await post(`/api/v1/professional-session/${bookingId}/end`, {
        endReason
      });
      if (response.data.variant === 'success') {
        return response.data.myData;
      }
      throw new Error(response.data.message || 'Failed to end session');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Send chat message during session
   */
  async sendChatMessage(bookingId: string, message: string, messageType: 'text' | 'emoji' = 'text'): Promise<{timestamp: string, sender: string}> {
    try {
      const response = await post(`/api/v1/professional-session/${bookingId}/chat`, {
        message,
        messageType
      });
      if (response.data.variant === 'success') {
        return response.data.myData;
      }
      throw new Error(response.data.message || 'Failed to send chat message');
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Get session chat history
   */
  async getChatHistory(bookingId: string): Promise<{chatHistory: ChatMessage[], totalMessages: number}> {
    try {
      const response = await get(`/api/v1/professional-session/${bookingId}/chat`);
      if (response.data.variant === 'success') {
        return response.data.myData;
      }
      throw new Error(response.data.message || 'Failed to get chat history');
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Update session quality metrics
   */
  async updateSessionQuality(bookingId: string, qualityData: any): Promise<void> {
    try {
      const response = await post(`/api/v1/professional-session/${bookingId}/quality`, qualityData);
      if (response.data.variant !== 'success') {
        throw new Error(response.data.message || 'Failed to update session quality');
      }
    } catch (error) {
      console.error('Error updating session quality:', error);
      throw error;
    }
  }
}

export default new ProfessionalSessionService(); 
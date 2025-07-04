import { get, post, put } from '../config/axiosConfig';

// SIMPLIFIED interfaces to match our new backend
export interface LobbyDetails {
  bookingId: string;
  sessionState: 'scheduled' | 'lobby_active' | 'in_progress' | 'completed';
  scheduledDate: string;
  scheduledTime: string;
  endTime: string;
  duration: number;
  topic?: string;
  studentNotes?: string;
  streamCallId?: string; // Only exists after someone joins
  lobbyActivatedAt?: string;
  canJoinSession: boolean;
  timeToLobby?: string;
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

class SimplifiedProfessionalSessionService {
  /**
   * SIMPLIFIED: Get session lobby details
   */
  async getLobbyDetails(bookingId: string): Promise<LobbyDetails> {
    try {
      const response = await get(`/api/v1/professional-session/${bookingId}/lobby`);
      if (response.data.variant === 'success') {
        return response.data.myData;
      }
      throw new Error(response.data.message || 'Failed to get lobby details');
    } catch (error) {
      console.error('Error getting lobby details:', error);
      throw error;
    }
  }

  /**
   * SIMPLIFIED: Join professional session (creates GetStream call if needed)
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
   * SIMPLIFIED: Handle participant disconnection
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
   * SIMPLIFIED: End professional session
   */
  async endSession(bookingId: string, endReason: string = 'ended_by_participant'): Promise<{sessionId: string, duration: number, endReason: string}> {
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
}

export default new SimplifiedProfessionalSessionService(); 
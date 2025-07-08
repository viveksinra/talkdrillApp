import { get, post, put } from '../config/axiosConfig';

interface JoinSessionResponse {
  sessionId: string;
  bookingId: string;
  streamCallId: string;
  streamToken: string;
  streamApiKey: string;
  userRole: string;
  sessionState: string;
  recordingEnabled: boolean;
  participant: {
    name: string;
    profileImage?: string;
  };
}

interface LobbyDetailsResponse {
  canJoinSession: boolean;
  sessionState: string;
  topic?: string;
  participant: {
    name: string;
    profileImage?: string;
    specializations?: string[];
  };
}

interface TranscriptionControlResponse {
  sessionId: string;
  streamCallId: string;
  transcriptionStatus: 'started' | 'stopped';
}

class ProfessionalSessionService {
  /**
   * Get lobby details for a booking
   */
  async getLobbyDetails(bookingId: string): Promise<LobbyDetailsResponse> {
    try {
      const response = await get(`/professional-session/${bookingId}/lobby`);
      return response.data.myData;
    } catch (error) {
      console.error('Error getting lobby details:', error);
      throw error;
    }
  }

  /**
   * Join a professional session call
   */
  async joinSessionCall(bookingId: string): Promise<JoinSessionResponse> {
    try {
      const response = await post(`/professional-session/${bookingId}/join`);
      return response.data.myData;
    } catch (error) {
      console.error('Error joining session call:', error);
      throw error;
    }
  }

  /**
   * End a professional session
   */
  async endSession(bookingId: string, endReason: string = 'ended_by_student'): Promise<void> {
    try {
      await post(`/professional-session/${bookingId}/end`, {
        endReason
      });
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Handle disconnection from session
   */
  async handleDisconnection(bookingId: string, reason: string): Promise<void> {
    try {
      await post(`/professional-session/${bookingId}/disconnect`, {
        reason
      });
    } catch (error) {
      console.error('Error handling disconnection:', error);
      throw error;
    }
  }

  /**
   * Start transcription for a session
   */
  async startTranscription(sessionId: string): Promise<TranscriptionControlResponse> {
    try {
      const response = await post(`/transcription/start/${sessionId}`);
      return response.data.myData;
    } catch (error) {
      console.error('Error starting transcription:', error);
      throw error;
    }
  }

  /**
   * Stop transcription for a session
   */
  async stopTranscription(sessionId: string): Promise<TranscriptionControlResponse> {
    try {
      const response = await post(`/transcription/stop/${sessionId}`);
      return response.data.myData;
    } catch (error) {
      console.error('Error stopping transcription:', error);
      throw error;
    }
  }

  // ✅ UNIFIED REPORT GENERATION FOR PROFESSIONAL SESSIONS
  async generateSessionReport(sessionId: string): Promise<any> {
    try {
      const response = await post(`/api/v1/report/generate/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error generating session report:', error);
      throw error;
    }
  }

  async getSessionReportStatus(sessionId: string): Promise<any> {
    try {
      const response = await get(`/api/v1/transcription/report-status/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting session report status:', error);
      throw error;
    }
  }
}

export default new ProfessionalSessionService(); 
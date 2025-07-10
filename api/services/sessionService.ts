import { get } from '../config/axiosConfig';

interface Session {
  _id: string;
  startTime: string;
  duration: number;
  professional?: {
    name: string;
    profileImage?: string;
  };
}

class SessionService {
  /**
   * Get user sessions by type
   */
  async getUserSessions(sessionType: string = 'professional_session'): Promise<Session[]> {
    try {
      const response = await get(`/session/user-sessions?type=${sessionType}`);
      return response.data.myData;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }
}

export default new SessionService(); 
import { get, post} from '@/api/config/axiosConfig'

interface TranscriptionStatus {
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  reportStatus: 'not_started' | 'in_progress' | 'completed' | 'failed';
  hasTranscription: boolean;
  hasReport: boolean;
}

interface ReportStatus {
  reportStatus: 'not_started' | 'in_progress' | 'completed' | 'failed';
  reportGeneratedAt: string | null;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  canGenerateReport: boolean;
}

class TranscriptionService {
  /**
   * Get transcription status for a session
   */
  async getTranscriptionStatus(sessionId: string): Promise<TranscriptionStatus> {
    try {
      const response = await get(`/transcription/status/${sessionId}`);
      return response.data.myData;
    } catch (error) {
      console.error('Error getting transcription status:', error);
      throw error;
    }
  }

  /**
   * Get report generation status for a session
   */
  async getReportStatus(sessionId: string): Promise<ReportStatus> {
    try {
      const response = await get(`/transcription/report-status/${sessionId}`);
      return response.data.myData;
    } catch (error) {
      console.error('Error getting report status:', error);
      throw error;
    }
  }

  /**
   * Manually trigger report generation
   */
  async generateReport(sessionId: string): Promise<{ success: boolean; reportId: string; sessionId: string }> {
    try {
      const response = await post(`/transcription/generate-report/${sessionId}`);
      return response.data.myData;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
}

export default new TranscriptionService();
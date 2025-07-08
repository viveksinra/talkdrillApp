import { get, post, put } from '../config/axiosConfig';

// ✅ UNIFIED REPORT GENERATION
export const generateReportFromSession = async (sessionId: string) => {
  try {
    const response = await post(`/api/v1/report/generate/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error generating report from session:', error);
    throw error;
  }
};

export const generateReportFromConversation = async (conversationId: string) => {
  try {
    const response = await post(`/api/v1/report/generate/conversation/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error generating report from conversation:', error);
    throw error;
  }
};

// ✅ UNIFIED REPORT RETRIEVAL
export const getReportById = async (reportId: string) => {
  try {
    const response = await get(`/api/v1/report/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting report:', error);
    throw error;
  }
};

// Get all user reports
export const getUserReports = async (page: number = 1, limit: number = 10, saved: boolean = false) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      saved: saved.toString()
    });
    const response = await get(`/api/v1/report/user/all?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user reports:', error);
    throw error;
  }
};

// Toggle save/unsave report
export const toggleSaveReport = async (reportId: string) => {
  try {
    const response = await put(`/api/v1/report/${reportId}/toggle-save`);
    return response.data;
  } catch (error) {
    console.error('Error toggling report save:', error);
    throw error;
  }
};

// Export report as PDF
export const exportReportAsPDF = async (reportId: string) => {
  try {
    const response = await post(`/api/v1/report/${reportId}/export/pdf`);
    return response.data;
  } catch (error) {
    console.error('Error exporting report as PDF:', error);
    throw error;
  }
};

// Export report as CSV
export const exportReportAsCSV = async (reportId: string) => {
  try {
    const response = await post(`/api/v1/report/${reportId}/export/csv`);
    return response.data;
  } catch (error) {
    console.error('Error exporting report as CSV:', error);
    throw error;
  }
};

// Generate share link for report
export const generateShareLink = async (reportId: string) => {
  try {
    const response = await post(`/api/v1/report/${reportId}/share`);
    return response.data;
  } catch (error) {
    console.error('Error generating share link:', error);
    throw error;
  }
};

// Schedule follow-up for report
export const scheduleFollowUp = async (reportId: string, followUpData: {
  type: 'email' | 'notification';
  scheduledFor: string;
  message?: string;
}) => {
  try {
    const response = await post(`/api/v1/report/${reportId}/follow-up`, followUpData);
    return response.data;
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    throw error;
  }
}; 
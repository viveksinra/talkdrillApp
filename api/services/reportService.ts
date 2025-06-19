import { get, post, put } from '../config/axiosConfig';

// Generate report for a session
export const generateReport = async (sessionId: string) => {
  try {
    const response = await post(`/api/v1/report/generate/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

// Get detailed report by ID
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
export const getUserReports = async () => {
  try {
    const response = await get('/api/v1/report/user');
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
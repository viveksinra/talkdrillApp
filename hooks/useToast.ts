import { useState } from 'react';
import { Alert } from 'react-native';

interface ToastOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  const showToast = ({ title, message, type = 'info' }: ToastOptions) => {
    // For now, using Alert for cross-platform compatibility
    // You can replace this with a custom toast component later
    Alert.alert(
      title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'),
      message,
      [{ text: 'OK' }]
    );
  };

  const showReportGenerationToast = () => {
    showToast({
      title: 'Report Generation Started',
      message: 'Your session report is being generated. You can check the progress in the Reports section of your profile.',
      type: 'success'
    });
  };

  return {
    showToast,
    showReportGenerationToast
  };
}; 
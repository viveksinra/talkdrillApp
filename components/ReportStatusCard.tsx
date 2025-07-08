import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '../constants/Colors';
import transcriptionService from '../api/services/transcriptionService';

interface ReportStatusCardProps {
  sessionId: string;
  onReportReady?: () => void;
}

export const ReportStatusCard: React.FC<ReportStatusCardProps> = ({ 
  sessionId, 
  onReportReady 
}) => {
  const [status, setStatus] = useState<{
    transcriptionStatus: string;
    reportStatus: string;
    hasTranscription: boolean;
    hasReport: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
    
    // Poll for status updates every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

  const checkStatus = async () => {
    try {
      const transcriptionStatus = await transcriptionService.getTranscriptionStatus(sessionId);
      setStatus(transcriptionStatus);
      setError(null);
      
      // Notify parent if report is ready
      if (transcriptionStatus.hasReport && onReportReady) {
        onReportReady();
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setError('Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!status) return 'clock';
    
    if (status.hasReport) {
      return 'checkmark.circle.fill';
    } else if (status.reportStatus === 'in_progress') {
      return 'clock.arrow.circlepath';
    } else if (status.transcriptionStatus === 'processing') {
      return 'waveform.path.ecg';
    } else {
      return 'clock';
    }
  };

  const getStatusText = () => {
    if (!status) return 'Checking status...';
    
    if (status.hasReport) {
      return 'Report ready! Tap to view';
    } else if (status.reportStatus === 'in_progress') {
      return 'Generating your report...';
    } else if (status.transcriptionStatus === 'processing') {
      return 'Processing session transcription...';
    } else if (status.transcriptionStatus === 'completed') {
      return 'Starting report generation...';
    } else {
      return 'Waiting for transcription...';
    }
  };

  const getStatusColor = () => {
    if (!status) return Colors.light.text;
    
    if (status.hasReport) {
      return Colors.light.success || '#4CAF50';
    } else if (status.reportStatus === 'in_progress' || status.transcriptionStatus === 'processing') {
      return Colors.light.primary;
    } else {
      return Colors.light.text;
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Checking report status...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <IconSymbol name="exclamationmark.triangle" size={24} color={Colors.light.error || '#F44336'} />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity onPress={checkStatus} style={styles.retryButton}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.statusRow}>
        <IconSymbol 
          name={getStatusIcon()} 
          size={24} 
          color={getStatusColor()} 
        />
        <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </ThemedText>
      </View>
      
      {status && !status.hasReport && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: status.transcriptionStatus === 'completed' ? '70%' : '30%' 
                }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText}>
            {status.transcriptionStatus === 'completed' ? '70%' : '30%'} complete
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border || '#E0E0E0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.border || '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.light.text,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.error || '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  retryText: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: '500',
  },
}); 
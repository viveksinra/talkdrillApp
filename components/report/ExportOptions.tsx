import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface Props {
  reportId: string;
  onExportPDF: (reportId: string) => Promise<void>;
  onExportCSV: (reportId: string) => Promise<void>;
  onGenerateShareLink: (reportId: string) => Promise<void>;
  onScheduleFollowUp: (reportId: string) => Promise<void>;
}

export const ExportOptions: React.FC<Props> = ({ 
  reportId, 
  onExportPDF, 
  onExportCSV, 
  onGenerateShareLink, 
  onScheduleFollowUp 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: string, action: () => Promise<void>) => {
    setLoading(type);
    try {
      await action();
    } catch (error) {
      Alert.alert('Error', `Failed to ${type.toLowerCase()}. Please try again.`);
    } finally {
      setLoading(null);
    }
  };

  const exportOptions = [
    {
      id: 'pdf',
      title: 'Export as PDF',
      icon: 'doc.text.fill' as const,
      isPrimary: false,
      action: () => handleExport('Export PDF', () => onExportPDF(reportId)),
    },
    {
      id: 'csv',
      title: 'Export as CSV',
      icon: 'doc.plaintext.fill' as const,
      isPrimary: false,
      action: () => handleExport('Export CSV', () => onExportCSV(reportId)),
    },
    {
      id: 'share',
      title: 'Share Report Link',
      icon: 'square.and.arrow.up.fill' as const,
      isPrimary: false,
      action: () => handleExport('Generate Share Link', () => onGenerateShareLink(reportId)),
    },
    // {
    //   id: 'followup',
    //   title: 'Schedule Follow-up',
    //   icon: 'calendar.circle.fill' as const,
    //   isPrimary: false,
    //   isSpecial: false,
    //   action: () => handleExport('Schedule Follow-up', () => onScheduleFollowUp(reportId)),
    // },
  ];

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle" style={styles.title}>Export</ThemedText>
        <View style={styles.iconContainer}>
          <IconSymbol 
            size={24} 
            name={isExpanded ? "chevron.up" : "chevron.down"} 
            color="#000" 
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.optionsList}>
            {exportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  option.isPrimary && styles.optionButtonPrimary,
                  loading === option.id && styles.optionButtonLoading
                ]}
                onPress={option.action}
                disabled={loading !== null}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionIconContainer,
                    option.isPrimary && styles.iconContainerPrimary,
                    
                  ]}>
                    <IconSymbol 
                      size={20} 
                      name={option.icon} 
                      color={option.isPrimary ? '#FFFFFF' : '#2196F3'} 
                    />
                  </View>
                  <ThemedText style={[
                    styles.optionTitle,
                    option.isPrimary && styles.optionTitlePrimary
                  ]}>
                    {option.title}
                  </ThemedText>
                  {loading === option.id && (
                    <View style={styles.loadingIndicator}>
                      <IconSymbol size={16} name="arrow.2.circlepath" color="#666" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  iconContainer: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  optionsList: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  optionButtonPrimary: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionButtonSpecial: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  optionButtonLoading: {
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainerSpecial: {
    backgroundColor: '#FFF0EB',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  optionTitlePrimary: {
    color: '#FFFFFF',
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
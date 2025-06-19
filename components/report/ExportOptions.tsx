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
      description: 'Generate a comprehensive PDF report',
      icon: 'doc.fill' as const,
      color: '#DC2626',
      action: () => handleExport('Export PDF', () => onExportPDF(reportId)),
    },
    {
      id: 'csv',
      title: 'Export as CSV',
      description: 'Download data in spreadsheet format',
      icon: 'square.grid.3x1.folder.fill.badge.plus' as const,
      color: '#059669',
      action: () => handleExport('Export CSV', () => onExportCSV(reportId)),
    },
    {
      id: 'share',
      title: 'Generate Share Link',
      description: 'Create a shareable link for this report',
      icon: 'link' as const,
      color: '#2563EB',
      action: () => handleExport('Generate Share Link', () => onGenerateShareLink(reportId)),
    },
    {
      id: 'followup',
      title: 'Schedule Follow-up',
      description: 'Set a reminder to review progress',
      icon: 'calendar.badge.plus' as const,
      color: '#9333EA',
      action: () => handleExport('Schedule Follow-up', () => onScheduleFollowUp(reportId)),
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle" style={styles.title}>Export Options</ThemedText>
        <IconSymbol 
          size={20} 
          name={isExpanded ? "chevron.up" : "chevron.down"} 
          color="#666" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <ThemedText style={styles.description}>
            Export your report in different formats or share it with others
          </ThemedText>
          
          <View style={styles.optionsGrid}>
            {exportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, loading === option.id && styles.optionCardLoading]}
                onPress={option.action}
                disabled={loading !== null}
                activeOpacity={0.7}
              >
                <View style={styles.optionHeader}>
                  <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                    <IconSymbol size={24} name={option.icon} color={option.color} />
                  </View>
                  {loading === option.id && (
                    <View style={styles.loadingIndicator}>
                      <IconSymbol size={16} name="arrow.2.circlepath" color="#666" />
                    </View>
                  )}
                </View>
                
                <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                <ThemedText style={styles.optionDescription}>{option.description}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <IconSymbol size={16} name="info.circle.fill" color="#4A86E8" />
            <ThemedText style={styles.noteText}>
              Exported files will be available for download for 7 days. Share links expire after 30 days.
            </ThemedText>
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
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
  },
  optionCardLoading: {
    opacity: 0.6,
  },
  optionHeader: {
    position: 'relative',
    marginBottom: 8,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#4A86E8',
    flex: 1,
    lineHeight: 16,
  },
}); 
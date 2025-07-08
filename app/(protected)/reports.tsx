import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  View,
  Text
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import transcriptionService from '@/api/services/transcriptionService';
import sessionService from '@/api/services/sessionService';

interface SessionReport {
  sessionId: string;
  date: string;
  professionalName: string;
  duration: number;
  reportStatus: 'not_started' | 'in_progress' | 'completed' | 'failed';
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  hasReport: boolean;
}

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      // Get all professional sessions for the user
      const sessions = await sessionService.getUserSessions('professional_session');
      
      // Get report status for each session
      const reportsWithStatus = await Promise.all(
        sessions.map(async (session: any) => {
          try {
            const status = await transcriptionService.getReportStatus(session._id);
            return {
              sessionId: session._id,
              date: session.startTime,
              professionalName: session.professional?.name || 'Professional',
              duration: Math.round(session.duration / 60) || 0,
              reportStatus: status.reportStatus,
              transcriptionStatus: status.transcriptionStatus,
              hasReport: status.reportStatus === 'completed'
            };
          } catch (error) {
            console.error('Error getting report status for session:', session._id, error);
            return {
              sessionId: session._id,
              date: session.startTime,
              professionalName: session.professional?.name || 'Professional',
              duration: Math.round(session.duration / 60) || 0,
              reportStatus: 'not_started' as const,
              transcriptionStatus: 'pending' as const,
              hasReport: false
            };
          }
        })
      );

      setReports(reportsWithStatus);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const getStatusColor = (reportStatus: string, transcriptionStatus: string) => {
    if (reportStatus === 'completed') {
      return Colors.light.success || '#4CAF50';
    } else if (reportStatus === 'in_progress' || transcriptionStatus === 'processing') {
      return Colors.light.primary;
    } else if (reportStatus === 'failed') {
      return Colors.light.error || '#F44336';
    } else {
      return Colors.light.text;
    }
  };

  const getStatusText = (reportStatus: string, transcriptionStatus: string) => {
    if (reportStatus === 'completed') {
      return 'Report Ready';
    } else if (reportStatus === 'in_progress') {
      return 'Generating Report...';
    } else if (transcriptionStatus === 'processing') {
      return 'Processing Transcription...';
    } else if (reportStatus === 'failed') {
      return 'Report Generation Failed';
    } else {
      return 'Waiting for Processing';
    }
  };

  const getStatusIcon = (reportStatus: string, transcriptionStatus: string) => {
    if (reportStatus === 'completed') {
      return 'checkmark.circle.fill';
    } else if (reportStatus === 'in_progress' || transcriptionStatus === 'processing') {
      return 'clock.arrow.circlepath';
    } else if (reportStatus === 'failed') {
      return 'exclamationmark.circle.fill';
    } else {
      return 'clock';
    }
  };

  const handleReportPress = (report: SessionReport) => {
    if (report.hasReport) {
      // Navigate to report details
      router.push({
        pathname: '/report-details/[sessionId]',
        params: { sessionId: report.sessionId }
      });
    } else {
      // Show status message
      const statusMessage = getStatusText(report.reportStatus, report.transcriptionStatus);
      alert(statusMessage);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderReportItem = ({ item }: { item: SessionReport }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => handleReportPress(item)}
      disabled={!item.hasReport}
    >
      <View style={styles.reportHeader}>
        <ThemedText style={styles.professionalName}>{item.professionalName}</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.reportStatus, item.transcriptionStatus) + '20' }]}>
          <IconSymbol 
            name={getStatusIcon(item.reportStatus, item.transcriptionStatus)} 
            size={14} 
            color={getStatusColor(item.reportStatus, item.transcriptionStatus)} 
          />
          <ThemedText style={[styles.statusText, { color: getStatusColor(item.reportStatus, item.transcriptionStatus) }]}>
            {getStatusText(item.reportStatus, item.transcriptionStatus)}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.reportDetails}>
        <ThemedText style={styles.dateText}>{formatDate(item.date)}</ThemedText>
        <ThemedText style={styles.durationText}>{item.duration} minutes</ThemedText>
      </View>

      {item.hasReport && (
        <View style={styles.viewReportButton}>
          <ThemedText style={styles.viewReportText}>View Report</ThemedText>
          <IconSymbol name="chevron.right" size={16} color={Colors.light.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading reports...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Session Reports</ThemedText>
        <ThemedText style={styles.subtitle}>
          View your professional session analysis and feedback
        </ThemedText>
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.sessionId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={48} color={Colors.light.text} />
            <ThemedText style={styles.emptyText}>No session reports yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Complete a professional session to get your first report
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.text,
    opacity: 0.7,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  reportCard: {
    backgroundColor: Colors.light.surface || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border || '#E0E0E0',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
  },
  durationText: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  viewReportText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.light.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
    textAlign: 'center',
  },
});
```

## 9. Create Report Details Screen (reusing existing components)

```typescript:talkdrillApp/app/(protected)/report-details/[sessionId].tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import reportService from '@/api/services/reportService';

// Import existing report components from AI call flow
import { ConversationOverview } from '@/components/report/ConversationOverview';
import { DetailedAnalysis } from '@/components/report/DetailedAnalysis';

export default function ReportDetailsScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    try {
      const reportData = await reportService.getReport(sessionId as string);
      setReport(reportData);
    } catch (error) {
      console.error('Error loading report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <div style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading report...</ThemedText>
        </div>
      </ThemedView>
    );
  }

  if (error || !report) {
    return (
      <ThemedView style={styles.container}>
        <div style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {error || 'Report not found'}
          </ThemedText>
        </div>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ConversationOverview report={report} />
      <DetailedAnalysis report={report} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
  },
});
```

## 10. Add Reports Tab to Navigation

```typescript:talkdrillApp/app/(protected)/(tabs)/_layout.tsx
// Add reports tab
<Tabs.Screen
  name="reports"
  options={{
    title: 'Reports',
    tabBarIcon: ({ color, focused }) => (
      <IconSymbol size={28} name={focused ? 'doc.text.fill' : 'doc.text'} color={color} />
    ),
  }}
/>
```

## 11. Create Session Service for Getting User Sessions

```typescript:talkdrillApp/api/services/sessionService.ts
import { privateAxiosInstance } from '../config/privateAxiosInstance';

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
      const response = await privateAxiosInstance.get(`/session/user-sessions?type=${sessionType}`);
      return response.data.myData;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }
}

export default new SessionService();
```

## 12. Add Session Endpoint to Backend

```javascript:talkdrillbackend/routes/api/v1/session.js
// Add this route to get user sessions
router.get('/user-sessions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    
    const query = { user: userId };
    if (type) {
      query.sessionType = type;
    }
    
    const sessions = await Session.find(query)
      .populate('professional', 'name profileImage')
      .sort({ startTime: -1 })
      .limit(50);
    
    res.json({
      message: "Sessions retrieved successfully",
      variant: "success",
      myData: sessions
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({
      message: "Failed to get sessions",
      variant: "error"
    });
  }
});
```

This implementation provides:

1. **Automatic Transcription Control**: Starts when student joins, stops when call ends
2. **Robust Error Handling**: Graceful failures without user interruption
3. **Toast Notifications**: Informs users about report generation progress
4. **Reports Dashboard**: Shows all session reports with status
5. **Status Tracking**: Real-time status updates for transcription and report generation
6. **Reused Components**: Leverages existing report components from AI call flow
7. **Clean User Experience**: Seamless integration with existing session flow

The flow is:
1. Student joins professional session → Transcription starts automatically
2. Call ends → Transcription stops automatically
3. Rating/Review screen → Shows report generation toast
4. Reports page → Shows all reports with status
5. Completed reports → Can be viewed with full analysis

The professional app requires no changes, and the transcription/report generation happens transparently in the background. 
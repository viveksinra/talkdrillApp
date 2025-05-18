import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Session } from '@/types';

export default function SessionHistoryScreen() {
  const router = useRouter();
  
  // Mock session history data
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 'session1',
      type: 'ai-chat',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      duration: 30 * 60, // 30 minutes
      hasReport: true,
      reportId: '1'
    },
    {
      id: 'session2',
      type: 'peer-call',
      partnerId: 'peer1',
      partnerName: 'Alex',
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 1 day ago + 45 minutes
      duration: 45 * 60, // 45 minutes
      hasReport: true,
      reportId: '2'
    },
    {
      id: 'session3',
      type: 'ai-call',
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000), // 3 days ago + 20 minutes
      duration: 20 * 60, // 20 minutes
      hasReport: false
    }
  ]);
  
  const handleViewReport = (reportId: string) => {
    router.push({
      pathname: '/report-detailed',
      params: { reportId }
    });
  };
  
  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'ai-chat':
        return <IconSymbol size={24} name="message.fill" color="#4A86E8" />;
      case 'ai-call':
        return <IconSymbol size={24} name="phone.fill" color="#4A86E8" />;
      case 'peer-chat':
        return <IconSymbol size={24} name="bubble.left.and.bubble.right.fill" color="#F5A623" />;
      case 'peer-call':
        return <IconSymbol size={24} name="person.wave.2.fill" color="#F5A623" />;
      default:
        return <IconSymbol size={24} name="doc.text.fill" color="#4A86E8" />;
    }
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };
  
  const getSessionTitle = (session: Session) => {
    switch (session.type) {
      case 'ai-chat':
        return 'AI Chat Session';
      case 'ai-call':
        return 'AI Call Session';
      case 'peer-chat':
        return `Chat with ${session.partnerName || 'Peer'}`;
      case 'peer-call':
        return `Call with ${session.partnerName || 'Peer'}`;
      default:
        return 'Session';
    }
  };
  
  const renderSessionItem = ({ item }: { item: Session }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionIcon}>
          {getSessionTypeIcon(item.type)}
        </View>
        <ThemedText style={styles.dateText}>
          {formatDate(item.startTime)} {formatTime(item.startTime)}
        </ThemedText>
      </View>
      
      <ThemedText type="defaultSemiBold">{getSessionTitle(item)}</ThemedText>
      
      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <IconSymbol size={16} name="clock.fill" color="#888" />
          <ThemedText style={styles.detailText}>
            {item.duration ? formatDuration(item.duration) : 'In progress'}
          </ThemedText>
        </View>
        
        {item.type.includes('peer') && item.partnerName && (
          <View style={styles.detailItem}>
            <IconSymbol size={16} name="person.fill" color="#888" />
            <ThemedText style={styles.detailText}>{item.partnerName}</ThemedText>
          </View>
        )}
      </View>
      
      {item.hasReport ? (
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => handleViewReport(item.reportId!)}>
          <ThemedText style={styles.reportButtonText}>View Report</ThemedText>
          <IconSymbol size={16} name="chevron.right" color="#4A86E8" />
        </TouchableOpacity>
      ) : (
        <ThemedText style={styles.noReportText}>No report available</ThemedText>
      )}
    </View>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Session History',
        }}
      />
      <ThemedView style={styles.container}>
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="clock" color="#888" />
              <ThemedText style={styles.emptyText}>No sessions yet</ThemedText>
            </View>
          }
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  sessionCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  sessionDetails: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  reportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  reportButtonText: {
    color: '#4A86E8',
    marginRight: 4,
  },
  noReportText: {
    textAlign: 'center',
    padding: 8,
    color: '#888',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
  },
}); 
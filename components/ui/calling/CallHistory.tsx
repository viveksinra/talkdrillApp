import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCallHistory } from '../../../api/services/callService';
import ThemedView from '../../ThemedView';
import ThemedText from '../../ThemedText';

interface Call {
  _id: string;
  caller: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  receiver?: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  isAICall: boolean;
  status: string;
  duration: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface CallHistoryProps {
  userId: string;
  onSelectUser: (userId: string, name: string) => void;
  onCallAI: () => void;
}

const CallHistory: React.FC<CallHistoryProps> = ({ userId, onSelectUser, onCallAI }) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const response = await getCallHistory();
      setCalls(response.calls);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCallTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCallDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call: Call) => {
    if (call.isAICall) {
      return <Ionicons name="logo-android" size={24} color="#3498db" />;
    }

    const isOutgoing = call.caller._id === userId;
    const isMissed = call.status === 'missed' || call.status === 'rejected';

    if (isOutgoing) {
      return <Ionicons name="call-outline" size={24} color="#2ecc71" />;
    } else if (isMissed) {
      return <Ionicons name="call-outline" size={24} color="#e74c3c" />;
    } else {
      return <Ionicons name="call-outline" size={24} color="#3498db" />;
    }
  };

  const renderCallItem = ({ item }: { item: Call }) => {
    const otherUser = item.caller._id === userId ? item.receiver : item.caller;
    const name = item.isAICall ? "AI Assistant" : (otherUser?.name || "Unknown");
    
    return (
      <TouchableOpacity 
        style={styles.callItem}
        onPress={() => {
          if (item.isAICall) {
            onCallAI();
          } else if (otherUser) {
            onSelectUser(otheruser.id, otherUser.name);
          }
        }}
      >
        <View style={styles.callIcon}>
          {getCallIcon(item)}
        </View>
        <View style={styles.callInfo}>
          <ThemedText style={styles.callName}>{name}</ThemedText>
          <ThemedText style={styles.callDetails}>
            {item.status === 'missed' ? 'Missed call' : formatCallDuration(item.duration)}
            {' • '}
            {formatCallTime(item.createdAt)}
          </ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.callButton}
          onPress={() => {
            if (item.isAICall) {
              onCallAI();
            } else if (otherUser) {
              onSelectUser(otheruser.id, otherUser.name);
            }
          }}
        >
          <Ionicons name="call" size={24} color="#2ecc71" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Call History</ThemedText>
        <TouchableOpacity onPress={loadCallHistory}>
          <Ionicons name="refresh" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      <View style={styles.aiCallButton}>
        <TouchableOpacity 
          style={styles.aiButton}
          onPress={onCallAI}
        >
          <Ionicons name="logo-android" size={24} color="#fff" />
          <ThemedText style={styles.aiButtonText}>Call AI Assistant</ThemedText>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={calls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadCallHistory}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiCallButton: {
    padding: 15,
  },
  aiButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  aiButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  callIcon: {
    marginRight: 15,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: '600',
  },
  callDetails: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  callButton: {
    padding: 10,
  },
});

export default CallHistory; 
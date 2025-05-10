import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { startAICall, startUserCall } from '../../api/services/callService';
import socketService from '../../api/services/socketService';
import CallHistory from '../../components/ui/calling/CallHistory';
import UserCallScreen from '../../components/ui/calling/UserCallScreen';
import AICallScreen from '../../components/ui/calling/AICallScreen';
import {ThemedView} from '../../components/ThemedView';

enum CallState {
  IDLE,
  USER_CALL,
  AI_CALL
}

export default function CallsScreen() {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [callData, setCallData] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleSelectUser = (userId: string, name: string) => {
    setSelectedUser({ id: userId, name });
    initiateUserCall(userId);
  };

  const initiateUserCall = async (receiverId: string) => {
    try {
      const response = await startUserCall(receiverId);
      
      setCallData({
        callId: response.callId,
        callerId: user?._id,
        receiverId: receiverId,
        receiverName: selectedUser?.name || 'User',
        isOutgoing: true
      });
      
      setCallState(CallState.USER_CALL);
    } catch (error) {
      console.error('Error starting user call:', error);
      setSelectedUser(null);
    }
  };

  const initiateAICall = async () => {
    try {
      const response = await startAICall();
      
      setCallData({
        callId: response.callId,
        userId: user?._id,
        deepgramApiKey: response.credentials.deepgramApiKey
      });
      
      setCallState(CallState.AI_CALL);
    } catch (error) {
      console.error('Error starting AI call:', error);
    }
  };

  const handleEndCall = () => {
    setCallState(CallState.IDLE);
    setCallData(null);
    setSelectedUser(null);
  };

  const renderCallScreen = () => {
    switch (callState) {
      case CallState.USER_CALL:
        return (
          <UserCallScreen
            callId={callData.callId}
            callerId={callData.callerId}
            receiverId={callData.receiverId}
            receiverName={callData.receiverName}
            isOutgoing={callData.isOutgoing}
            onEndCall={handleEndCall}
          />
        );
      case CallState.AI_CALL:
        return (
          <AICallScreen
            callId={callData.callId}
            userId={callData.userId}
            deepgramApiKey={callData.deepgramApiKey}
            onEndCall={handleEndCall}
          />
        );
      default:
        return (
          <CallHistory
            userId={user?._id || ''}
            onSelectUser={handleSelectUser}
            onCallAI={initiateAICall}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        {renderCallScreen()}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
}); 
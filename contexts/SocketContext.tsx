import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import socketService from '../api/services/socketService';
import { useAuth } from './AuthContext';
import streamService from '../api/services/streamService';
import { useRouter } from 'expo-router';
import { Socket } from 'socket.io-client';

export interface SocketContextType {
  isConnected: boolean;
  onlineUsers: string[];
  socket: Socket | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendOffer: (roomId: string, offer: any) => void;
  sendAnswer: (roomId: string, answer: any) => void;
  sendIceCandidate: (roomId: string, candidate: any) => void;
  sendChatMessage: (roomId: string, message: any) => void;
  sendAITranscription: (userId: string, callId: string, message: string) => void;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
  onCallEvent: (event: string, callback: Function) => void;
  emit: (event: string, data: any) => void;
  startRealtimeSession: (userId: string, characterId: string, conversationId?: string, filters?: any) => void;
  sendRealtimeText: (text: string) => void;
  sendRealtimeTextChunked: (text: string, isInterim: boolean) => void;
  sendRealtimeAudio: (audioData: string) => void;
  commitRealtimeAudio: () => void;
  endRealtimeSession: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const router = useRouter();
  
  // Use a ref to track socket connection
  const socketRef = useRef<Socket | null>(null);
  const appState = useRef(AppState.currentState);
  
  // Function to establish socket connection
  const establishConnection = () => {
    console.log('Establishing connection for user:', user?.id);
    if (user?.id && !socketRef.current) {
      console.log('Connecting socket for user:', user.id);
      socketRef.current = socketService.connect(user.id);
      
      socketRef.current?.on('connect', () => {
        console.log('Socket connected with ID:', socketRef.current?.id);
        setIsConnected(true);
        socketRef.current?.emit('user_online', { userId: user.id });
      });
      
      socketRef.current?.on('connect_error', (error: any) => {
        console.error('SocketContext.tsx Socket connection error:', error);
        console.log('SocketContext.tsx Socket connection error:', error);
      });
      
      socketRef.current?.on('disconnect', (reason: any) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });
      
      socketRef.current?.on('online_users', (users: string[]) => {
        console.log('Received online users:', users);
        setOnlineUsers(users);
      });
      
      // Listen for incoming call offers from Stream
      socketRef.current?.on('incoming_offer', async (offer: any) => {
        try {
          console.log('Received incoming call offer:', offer);
          
          Alert.alert(
            'Incoming Call',
            `${offer.callerName} is calling you${offer.durationInMinutes ? ` (${offer.durationInMinutes} min limit)` : ''}`,
            [
              {
                text: 'Decline',
                style: 'cancel'
              },
              {
                text: 'Accept',
                onPress: async () => {
                  try {
                    // Initialize stream client
                    await streamService.ensureInitialized(
                      user.id,
                      user.name,
                      user.profileImage
                    );
                    
                    // Navigate to call screen with duration parameter
                    router.push({
                      pathname: '/peer-call',
                      params: { 
                        callId: offer.callId,
                        streamCallId: offer.streamCallId,
                        peerId: offer.callerId,
                        peerName: offer.callerName,
                        peerImage: offer.callerImage,
                        durationInMinutes: offer.durationInMinutes?.toString() || '5', // Add duration
                        isIncoming: 'true'
                      }
                    });
                    
                    // Send answer after navigation to avoid UI blocking
                    socketService.sendAnswer(offer.roomId, {
                      status: 'accepted',
                      callId: offer.callId
                    });
                  } catch (error) {
                    console.error('Error accepting call:', error);
                    Alert.alert('Error', 'Could not join the call. Please try again.');
                  }
                }
              }
            ]
          );
        } catch (error) {
          console.error('Error handling incoming call offer:', error);
        }
      });

      socketRef.current?.on('incoming_answer', async (answer: any) => {
        try {
          console.log('Received incoming call answer:', answer);
        } catch (error) {
          console.error('Error handling incoming call answer:', error);
        }
      });
      
      

    }
  };
  
  // Initial connection when user is authenticated
  useEffect(() => {
    console.log('User ID:', user?.id);
    if (user?.id) {
      establishConnection();
    } else if (socketRef.current) {
      // Disconnect if user logs out
      socketService.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
    
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket');
        socketService.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]);
  
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        user?.id
      ) {
        // App has come to the foreground
        console.log('App has come to the foreground');
        
        // Check if socket is disconnected and reconnect if needed
        if (!isConnected && user?.id) {
          console.log('Reconnecting socket after app state change');
          // Clean up any existing connection first
          if (socketRef.current) {
            socketService.disconnect();
            socketRef.current = null;
          }
          // Reestablish connection
          establishConnection();
        }
      }
      
      appState.current = nextAppState;
    };
    
    // Subscribe to AppState change events
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [user?.id, isConnected]);
  
  const joinRoom = (roomId: string) => {
    socketService.joinRoom(roomId);
  };
  
  const leaveRoom = (roomId: string) => {
    socketService.leaveRoom(roomId);
  };
  
  const sendOffer = (roomId: string, offer: any) => {
    socketService.sendOffer(roomId, offer);
  };
  
  const sendAnswer = (roomId: string, answer: any) => {
    socketService.sendAnswer(roomId, answer);
  };
  
  const sendIceCandidate = (roomId: string, candidate: any) => {
    socketService.sendIceCandidate(roomId, candidate);
  };
  
  const sendAITranscription = (userId: string, callId: string, message: string) => {
    socketService.sendAITranscription(userId, callId, message);
  };
  
  const onCallEvent = (event: string, callback: Function) => {
    socketService.onCallEvent(event, callback);
  };

  const sendChatMessage = (roomId: string, message: any) => {
    socketService.sendChatMessage(roomId, message);
  };

  const emit = (event: string, data: any) => {
    socketService.emit(event, data);
  };
  
  const startRealtimeSession = (userId: string, characterId: string, conversationId?: string, filters?: any) => {
    socketService.startRealtimeSession(userId, characterId, conversationId, filters);
  };

  const sendRealtimeText = (text: string) => {
    socketService.sendRealtimeText(text);
  };

  const sendRealtimeTextChunked = (text: string, isInterim: boolean) => {
    socketService.sendRealtimeTextChunked(text, isInterim);
  };

  const sendRealtimeAudio = (audioData: string) => {
    socketService.sendRealtimeAudio(audioData);
  };

  const commitRealtimeAudio = () => {
    socketService.commitRealtimeAudio();
  };

  const endRealtimeSession = () => {
    socketService.endRealtimeSession();
  };

  return (
    <SocketContext.Provider value={{
      isConnected,
      onlineUsers,
      socket: socketRef.current,
      joinRoom,
      leaveRoom,
      sendOffer,
      sendAnswer,
      sendIceCandidate,
      sendChatMessage,
      sendAITranscription,
      on: socketService.on.bind(socketService),
      off: socketService.off.bind(socketService),
      onCallEvent,
      emit,
      startRealtimeSession,
      sendRealtimeText,
      sendRealtimeTextChunked,
      sendRealtimeAudio,
      commitRealtimeAudio,
      endRealtimeSession,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
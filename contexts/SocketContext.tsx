import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../api/services/socketService';
import { useAuth } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  onlineUsers: string[];
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendOffer: (roomId: string, offer: any) => void;
  sendAnswer: (roomId: string, answer: any) => void;
  sendIceCandidate: (roomId: string, candidate: any) => void;
  sendAITranscription: (userId: string, callId: string, message: string) => void;
  onCallEvent: (event: string, callback: Function) => void;
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
  
  // Use a ref to track socket connection
  const socketRef = React.useRef<any>(null);
  
  useEffect(() => {
    if (user?._id && !socketRef.current) {
      socketRef.current = socketService.connect();
      
      socketRef.current?.on('connect', () => {
        setIsConnected(true);
        socketRef.current.emit('user_online', { userId: user._id });
      });
      
      socketRef.current?.on('disconnect', () => {
        setIsConnected(false);
      });
      
      socketRef.current?.on('online_users', (users: string[]) => {
        setOnlineUsers(users);
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketService.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?._id]); // Only depend on user ID
  
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
  
  return (
    <SocketContext.Provider value={{
      isConnected,
      onlineUsers,
      joinRoom,
      leaveRoom,
      sendOffer,
      sendAnswer,
      sendIceCandidate,
      sendAITranscription,
      onCallEvent
    }}>
      {children}
    </SocketContext.Provider>
  );
};
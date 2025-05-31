import io, { Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/axiosConfig';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isReconnecting: boolean = false;

  // Initialize socket connection
  connect(userId: string) {
   
    
    if (this.socket) {
     
      
      if (!this.socket.connected) {
       
        this.socket.connect();
      } else {
       
      }
      
      return this.socket;
    }

    try {
      this.socket = io(SOCKET_BASE_URL, {
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000 // Increase connection timeout to 20 seconds
      });

      this.socket.on('connect', () => {
       
        this.triggerEvent('connect', { socketId: this.socket?.id, userId });
        this.clearReconnectInterval();
        
        // Send online status immediately after connection
        this.sendUserOnline(userId);
      });

      this.socket.on('disconnect', (reason) => {
       
        this.triggerEvent('disconnect', { reason });
        
        // Start reconnection if not already reconnecting
        if (!this.isReconnecting) {
          this.startReconnectInterval(userId);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.triggerEvent('connect_error', error);
        
        // Start reconnection if not already reconnecting
        if (!this.isReconnecting) {
          this.startReconnectInterval(userId);
        }
      });

      this.socket.on('connect_timeout', () => {
        console.error('Socket connection timeout');
        this.triggerEvent('connect_timeout', null);
      });

      // Online users event
      this.socket.on('online_users', (users) => {
       
        this.triggerEvent('online_users', users);
      });
      
      // Online status confirmation
      this.socket.on('online_status_confirmed', (data) => {
      
        this.triggerEvent('online_status_confirmed', data);
      });

      // audio/video call signaling events
      this.socket.on('incoming_offer', (offer) => {
        this.triggerEvent('incoming_offer', offer);
      });

      this.socket.on('incoming_answer', (answer) => {
        this.triggerEvent('incoming_answer', answer);
      });

      this.socket.on('incoming_ice_candidate', (candidate) => {
        this.triggerEvent('ice-candidate', candidate);
      });

      // Match events
      this.socket.on('search_started', (data) => {
       
        this.triggerEvent('search_started', data);
      });
      
      this.socket.on('match_found', (data) => {
       
        this.triggerEvent('match_found', data);
      });
      
      this.socket.on('search_timeout', (data) => {
        
        this.triggerEvent('search_timeout', data);
      });
      
      this.socket.on('search_error', (data) => {
       
        this.triggerEvent('search_error', data);
      });

      // Chat events
      this.socket.on('new_message', (message) => {
        this.triggerEvent('new_message', message);
      });

      // AI response event
      this.socket.on('ai_response', (data) => {
        this.triggerEvent('ai-response', data);
      });

      // Peer status event
      this.socket.on('peer_status', (data) => {
        this.triggerEvent('peer_status', data);
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
      // Attempt to reconnect
      this.startReconnectInterval(userId);
    }
    
    return this.socket;
  }

  private startReconnectInterval(userId: string) {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    
    this.isReconnecting = true;
    this.reconnectInterval = setInterval(() => {
      
      
      // Clean up old socket
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
      
      // Try to reconnect
      this.connect(userId);
    }, 5000);
  }
  
  private clearReconnectInterval() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    this.isReconnecting = false;
  }

  // Join room for signaling or chat
  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join_room', roomId);
    }
  }

  // Leave room
  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave_room', roomId);
    }
  }

  startMatching(userId: string, filters: any) {
    if (this.socket) {
      this.socket.emit('start_matching', { userId, filters });
    }
  }
  
  // Cancel an active matching search
  cancelMatching(userId: string) {
    if (this.socket) {
      this.socket.emit('cancel_matching', { userId });
    }
  }

  // Send online status
  sendUserOnline(userId: string) {
    if (this.socket) {
      this.socket.emit('user_online', { userId });
    }
  }

  // Send offer to peer
  sendOffer(roomId: string, offer: any) {
    if (this.socket) {
      this.socket.emit('call_offer', { roomId, offer });
    }
  }

  // Send answer to peer
  sendAnswer(roomId: string, answer: any) {
    if (this.socket) {
      this.socket.emit('call_answer', { roomId, answer });
    }
  }

  // Send ICE candidate
  sendIceCandidate(roomId: string, candidate: any) {
    if (this.socket) {
      this.socket.emit('ice_candidate', { roomId, candidate });
    }
  }

  // Send chat message
  sendChatMessage(roomId: string, message: any) {
    if (this.socket) {
      this.socket.emit('chat_message', { roomId, message });
    }
  }

  // Send AI transcription
  sendAITranscription(userId: string, callId: string, message: string) {
    if (this.socket) {
      this.socket.emit('ai_transcription', { userId, callId, message });
    }
  }

  // Generic emit function
  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Register event listeners
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  // Remove event listener
  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Trigger event
  private triggerEvent(event: string, data: any) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event) || [];
      callbacks.forEach(callback => callback(data));
    }
  }

  // For backward compatibility
  onCallEvent(event: string, callback: Function) {
    this.on(event, callback);
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
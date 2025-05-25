import io, { Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/axiosConfig';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  // Initialize socket connection
  connect(userId: string) {
    if (!this.socket) {
      this.socket = io(SOCKET_BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.triggerEvent('connect', { socketId: this.socket?.id, userId });
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.triggerEvent('disconnect', null);
      });

      // Online users event
      this.socket.on('online_users', (users) => {
        this.triggerEvent('online_users', users);
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
    }
    return this.socket;
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
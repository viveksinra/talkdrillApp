import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/axiosConfig';

class SocketService {
  private socket: Socket | null = null;
  private callListeners: Map<string, Function> = new Map();

  // Initialize socket connection
  connect() {
    if (!this.socket) {
      this.socket = io(API_BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // WebRTC signaling events
      this.socket.on('incoming_offer', (offer) => {
        this.triggerCallEvent('offer', offer);
      });

      this.socket.on('incoming_answer', (answer) => {
        this.triggerCallEvent('answer', answer);
      });

      this.socket.on('incoming_ice_candidate', (candidate) => {
        this.triggerCallEvent('ice-candidate', candidate);
      });

      // AI response event
      this.socket.on('ai_response', (data) => {
        this.triggerCallEvent('ai-response', data);
      });
    }
    return this.socket;
  }

  // Join room for signaling
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

  // Send AI transcription
  sendAITranscription(userId: string, callId: string, message: string) {
    if (this.socket) {
      this.socket.emit('ai_transcription', { userId, callId, message });
    }
  }

  // Register event listeners
  onCallEvent(event: string, callback: Function) {
    this.callListeners.set(event, callback);
  }

  // Trigger event
  private triggerCallEvent(event: string, data: any) {
    const callback = this.callListeners.get(event);
    if (callback) {
      callback(data);
    }
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
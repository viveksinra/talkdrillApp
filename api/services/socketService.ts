import io, { Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/axiosConfig';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isReconnecting: boolean = false;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;

  // Initialize socket connection
  connect(userId: string) {
    if (this.socket) {
      console.log('Socket already connected');
      return this.socket;
    }

    try {
      this.socket = io(SOCKET_BASE_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
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
        console.error('Socket-server connection error:', error);
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

      // NEW: Realtime API event handlers
      this.socket.on('realtime_session_started', (data) => {
        console.log('[SOCKET] Realtime session started:', data);
        this.triggerEvent('realtime_session_started', data);
      });

      this.socket.on('realtime_connection_opened', (data) => {
        console.log('[SOCKET] Realtime connection opened');
        this.triggerEvent('realtime_connection_opened', data);
      });

      this.socket.on('realtime_connection_closed', (data) => {
        console.log('[SOCKET] Realtime connection closed');
        this.triggerEvent('realtime_connection_closed', data);
      });

      this.socket.on('realtime_session_created', (data) => {
        console.log('[SOCKET] Realtime session created:', data);
        this.triggerEvent('realtime_session_created', data);
      });

      this.socket.on('realtime_text_delta', (data) => {
        this.triggerEvent('realtime_text_delta', data);
      });

      this.socket.on('realtime_text_complete', (data) => {
        console.log('[SOCKET] Text complete:', data);
        this.triggerEvent('realtime_text_complete', data);
      });

      this.socket.on('realtime_user_transcript', (data) => {
        console.log('[SOCKET] User transcript:', data);
        this.triggerEvent('realtime_user_transcript', data);
      });

      this.socket.on('realtime_audio_delta', (data) => {
        this.triggerEvent('realtime_audio_delta', data);
      });

      this.socket.on('realtime_audio_complete', (data) => {
        console.log('[SOCKET] Audio complete:', data);
        this.triggerEvent('realtime_audio_complete', data);
      });

      this.socket.on('realtime_response_complete', (data) => {
        console.log('[SOCKET] Response complete:', data);
        this.triggerEvent('realtime_response_complete', data);
      });

      this.socket.on('realtime_error', (data) => {
        console.error('[SOCKET] Realtime error:', data);
        this.triggerEvent('realtime_error', data);
      });

      this.socket.on('realtime_interim_transcript', (data) => {
        console.log('[SOCKET] Interim transcript:', data);
        this.triggerEvent('realtime_interim_transcript', data);
      });

    } catch (error) {
      console.error('Error initializing socket:', error);
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
    this.listeners.get(event)!.push(callback);
  }

  // Remove event listener
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Trigger event
  private triggerEvent(event: string, data: any) {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
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

  // NEW: Realtime API methods
  startRealtimeSession(userId: string, characterId: string, conversationId?: string) {
    if (this.socket && this.socket.connected) {
      console.log('[SOCKET] Starting realtime session');
      this.socket.emit('start_realtime_session', { 
        userId, 
        characterId, 
        conversationId 
      });
    } else {
      console.error('[SOCKET] Cannot start realtime session - socket not connected');
    }
  }

  sendRealtimeText(text: string) {
    if (this.socket && this.socket.connected) {
      console.log('[SOCKET] Sending realtime text:', text);
      this.socket.emit('send_realtime_text', { text });
    }
  }

  sendRealtimeAudio(audioData: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_realtime_audio', { audioData });
    }
  }

  commitRealtimeAudio() {
    if (this.socket && this.socket.connected) {
      console.log('[SOCKET] Committing realtime audio');
      this.socket.emit('commit_realtime_audio');
    }
  }

  endRealtimeSession() {
    if (this.socket && this.socket.connected) {
      console.log('[SOCKET] Ending realtime session');
      this.socket.emit('end_realtime_session');
    }
  }

  sendRealtimeTextChunked(text: string, isInterim: boolean = false) {
    if (this.socket && this.socket.connected) {
      console.log('[SOCKET] Sending chunked realtime text:', { text: text.substring(0, 50), isInterim });
      this.socket.emit('send_realtime_text_chunked', { text, isInterim });
    }
  }

  notifySpeechRecognitionStarted() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('speech_recognition_started');
    }
  }

  notifySpeechRecognitionEnded(metrics?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('speech_recognition_ended', metrics);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
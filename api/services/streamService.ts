import {
  StreamVideoClient,
  User,
  Call,
  CallType,
  StreamVideoParticipant
} from '@stream-io/video-react-native-sdk';
import { Alert } from 'react-native';
import { get, post, put } from '../config/axiosConfig';
import socketService from './socketService';

class StreamService {
  private client: StreamVideoClient | null = null;
  private currentUser: User | null = null;
  private currentCall: Call | null = null;
  private apiKey: string = '';

  /**
   * Initialize Stream client with user and token
   * @param userId User ID to connect as
   * @param token Stream token for authentication
   * @param apiKey Stream API key
   */
  async initialize(userId: string, token: string, apiKey: string) {
    try {
      // If we already have a client for the same user, reuse it
      if (this.client && this.currentUser?.id === userId) {
        return this.client;
      }
      
      // Set the API key
      this.apiKey = apiKey;
      
      // Create user object
      const user: User = {
        id: userId,
        name: userId,
      };
      
      // Initialize the Stream Video client
      this.client = new StreamVideoClient({
        apiKey,
        user,
        token
      });
      
      this.currentUser = user;
      
      console.log('Stream client initialized for user:', userId);
      
      return this.client;
    } catch (error) {
      console.error('Error initializing Stream client:', error);
      throw error;
    }
  }
  
  /**
   * Get a token from the backend for the current user
   */
  async getToken() {
    try {
      const response = await get('/api/v1/call/token');
      return {
        token: response.data.token,
        apiKey: response.data.apiKey
      };
    } catch (error) {
      console.error('Error getting Stream token:', error);
      throw error;
    }
  }
  
  /**
   * Join an existing call or create a new one
   * @param callId Unique identifier for the call
   * @param callType Type of call (default, audio, etc.)
   */
  async joinCall(callId: string, callType: string = 'default') {
    try {
      if (!this.client) {
        throw new Error('Stream client not initialized');
      }
      
      // Get or create call
      this.currentCall = this.client.call(callType as string, callId);
      
      // Join the call
      await this.currentCall.join({ create: true });
      
      return this.currentCall;
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }
  
  /**
   * Start a user-to-user call with another user
   * @param receiverId ID of the user to call
   */
  async startCall(receiverId: string) {
    try {
      // Create call on the backend
      const response = await post('/api/v1/call/user', {
        receiverId
      });
      
      // Get the call ID
      const { streamCallId, callId } = response.data;
      
      // Join the call
      await this.joinCall(streamCallId);
      
      // Notify the other user through socket
      socketService.sendOffer(`chat_${this.currentUser?.id}_${receiverId}`, {
        callId,
        streamCallId,
        callerId: this.currentUser?.id,
        receiverId
      });
      
      return {
        callId,
        streamCallId
      };
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }
  
  /**
   * End the current call
   */
  async endCall() {
    try {
      if (!this.currentCall) {
        console.warn('No active call to end');
        return;
      }
      
      await this.currentCall.leave();
      this.currentCall = null;
      
      return true;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }
  
  /**
   * Toggle camera on/off
   */
  async toggleCamera() {
    try {
      if (!this.currentCall) {
        throw new Error('No active call');
      }
      
      await this.currentCall.camera.toggle();
    } catch (error) {
      console.error('Error toggling camera:', error);
      throw error;
    }
  }
  
  /**
   * Toggle microphone on/off
   */
  async toggleMicrophone() {
    try {
      if (!this.currentCall) {
        throw new Error('No active call');
      }
      
      await this.currentCall.microphone.toggle();
    } catch (error) {
      console.error('Error toggling microphone:', error);
      throw error;
    }
  }
  
  /**
   * Switch between front and back cameras
   */
  async switchCamera() {
    try {
      if (!this.currentCall) {
        throw new Error('No active call');
      }
      
      await this.currentCall.camera.flip();
    } catch (error) {
      console.error('Error switching camera:', error);
      throw error;
    }
  }
  
  /**
   * Get the current Stream client
   */
  getClient() {
    return this.client;
  }
  
  /**
   * Get the current call
   */
  getCall() {
    return this.currentCall;
  }
  
  /**
   * Clean up resources when no longer needed
   */
  cleanup() {
    if (this.currentCall) {
      this.currentCall.leave().catch(error => {
        console.error('Error leaving call during cleanup:', error);
      });
      this.currentCall = null;
    }
    
    if (this.client) {
      this.client.disconnectUser().catch(error => {
        console.error('Error disconnecting user during cleanup:', error);
      });
      this.client = null;
    }
    
    this.currentUser = null;
  }
}

// Create singleton instance
const streamService = new StreamService();
export default streamService;

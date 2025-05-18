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
  private isInitializing: boolean = false;
  private initPromise: Promise<StreamVideoClient> | null = null;

  /**
   * Get token and initialize client in one call
   * Returns existing client if already initialized
   */
  async ensureInitialized(userId: string, userName?: string, userImage?: string) {
    // Return existing client if already set up for this user
    if (this.client && this.currentUser?.id === userId) {
      return this.client;
    }

    // Don't duplicate initialization
    if (this.isInitializing) {
      return this.initPromise;
    }

    try {
      this.isInitializing = true;
      
      // Get token first
      const { token, apiKey } = await this.getToken();
      
      // Create user object with profile data
      const user: User = {
        id: userId,
        name: userName || userId,
        image: userImage
      };
      
      // Initialize client
      this.apiKey = apiKey;
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
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
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
      
      // Join the call with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await this.currentCall.join({ create: true });
          console.log('Successfully joined call:', callId);
          
          // Check if we have proper state after joining
          if (!this.currentCall.state || !this.currentCall.state.participants) {
            console.log('Call joined but state or participants are missing, retrying...');
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          break; // Successfully joined
        } catch (error) {
          console.error(`Join attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return this.currentCall;
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }
  
  /**
   * Call another user (handles entire flow)
   */
  async callUser(receiverId: string, receiverName?: string) {
    try {
      // Ensure we're initialized first
      if (!this.client || !this.currentUser) {
        throw new Error('Stream client not initialized');
      }
      
      // Create call on backend
      const response = await post('/api/v1/call/user', {
        receiverId
      });
      
      const { streamCallId, callId } = response.data;
      
      // Join the call
      this.currentCall = this.client.call('default', streamCallId);
      await this.currentCall.join({ create: true });
      
      // By default, disable camera for audio-only
      await this.currentCall.camera.disable();
      
      // Notify the receiver through socket
      socketService.sendOffer(`chat_${this.currentUser.id}_${receiverId}`, {
        callId,
        streamCallId,
        callerId: this.currentUser.id,
        callerName: this.currentUser.name,
        callerImage: this.currentUser.image,
        receiverId,
        receiverName
      });
      
      return {
        callId,
        streamCallId,
        call: this.currentCall
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

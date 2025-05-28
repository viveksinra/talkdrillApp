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
      
      console.log(`Attempting to join call: ${callId} (type: ${callType})`);
      
      // CRITICAL FIX: First check if we already have a call object with the same ID
      // This handles the case where we might already be in the call
      if (this.currentCall && this.currentCall.id === callId) {
        console.log(`Already have a call object for ${callId}, checking state...`);
        
        // Check if call state exists
        if (this.currentCall.state) {
          console.log('Call appears to be already joined, using existing call object');
          return this.currentCall;
        }
      }
      
      // Create a fresh call object to avoid state conflicts
      this.currentCall = this.client.call(callType as string, callId);
      
      // Wait briefly before joining to ensure the call is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // First, try a getOrCreate to see if the call exists without joining
      try {
        console.log(`Checking if call ${callId} exists before joining`);
        await this.currentCall.getOrCreate();
        console.log(`Call ${callId} exists, will now attempt to join`);
      } catch (error) {
        console.log(`Error checking call existence:`, error);
        // Continue anyway - we'll try to join below
      }
      
      // Join the call with improved retry logic
      let retryCount = 0;
      const maxRetries = 5;
      let joined = false;
      
      while (retryCount < maxRetries && !joined) {
        try {
          console.log(`Join attempt ${retryCount + 1} for call ${callId}`);
          
          // For retries, create a new call object and wait longer
          if (retryCount > 0) {
            try {
              console.log(`Cleaning up before retry attempt ${retryCount + 1}`);
              
              // Complete cleanup of previous attempt
              if (this.currentCall) {
                try {
                  // Try to leave the call first
                  await this.currentCall.leave().catch(e => {
                    console.log('Error leaving call during retry cleanup:', e);
                  });
                } catch (leaveError) {
                  console.log('Error during leave call cleanup:', leaveError);
                }
              }
              
              // Wait between retries
              const waitTime = 1000 * retryCount;
              console.log(`Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              
              // Create a fresh call object for this attempt
              this.currentCall = this.client.call(callType as string, callId);
            } catch (cleanupError) {
              console.log('Error during cleanup before retry:', cleanupError);
            }
          }
          
          // Try joining the call
          try {
            await this.currentCall.join({ create: true });
            console.log(`Join attempt ${retryCount + 1} succeeded for call ${callId}`);
            joined = true;
          } catch (joinError: any) {
            // Check for the "Illegal State" error which indicates we're already joined
            if (joinError.message && joinError.message.includes('Illegal State')) {
              console.log('Detected Illegal State error, call was already joined. Treating as success.');
              
              // CRITICAL FIX: When we hit this error, the call object is likely in a weird state
              // Instead of using it directly, get a fresh call object
              try {
                // Get a fresh call object
                this.currentCall = this.client.call(callType as string, callId);
                
                // Query the call state without joining again
                await this.currentCall.getOrCreate();
                
                // If we get here, we're successfully connected to the call
                console.log('Successfully recovered from Illegal State error');
                joined = true;
                break;
              } catch (recoveryError) {
                console.error('Failed to recover from Illegal State error:', recoveryError);
                throw recoveryError;
              }
            } else {
              throw joinError;
            }
          }
          
          // Verify call state if we've joined
          if (joined) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (this.currentCall && this.currentCall.state) {
              console.log('Call state after join:', {
                callId: this.currentCall.id,
                hasState: !!this.currentCall.state,
                hasParticipants: !!this.currentCall.state.participants,
                participantCount: this.currentCall.state.participants ? Object.keys(this.currentCall.state.participants).length : 0
              });
              
              // Success! We're done
              break;
            } else {
              console.log('Call joined but state is missing, will retry');
              joined = false;
            }
          }
          
          retryCount++;
        } catch (error) {
          console.error(`Join attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw error;
          }
          
          // Wait before next retry
          const waitTime = 1000 + (retryCount * 500);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      if (!joined) {
        throw new Error(`Failed to join call after ${maxRetries} attempts`);
      }
      
      // Enable media by default
      try {
        await this.currentCall.microphone.enable();
        // Disable camera by default for all calls
        await this.currentCall.camera.disable();
      } catch (mediaError) {
        console.warn('Could not set default media devices state:', mediaError);
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

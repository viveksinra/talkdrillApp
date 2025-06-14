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
import { DEFAULT_CALL_LIMIT } from '../config/axiosConfig';

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
      
     
      
      // CRITICAL FIX: First check if we already have a call object with the same ID
      // This handles the case where we might already be in the call
      if (this.currentCall && this.currentCall.id === callId) {
       
        
        // Check if call state exists
        if (this.currentCall.state) {
         
          return this.currentCall;
        }
      }
      
      // Create a fresh call object to avoid state conflicts
      this.currentCall = this.client.call(callType as string, callId);
      
      // Wait briefly before joining to ensure the call is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // First, try a getOrCreate to see if the call exists without joining
      try {
       
        await this.currentCall.getOrCreate();
       
      } catch (error) {
       
        // Continue anyway - we'll try to join below
      }
      
      // Join the call with improved retry logic
      let retryCount = 0;
      const maxRetries = 5;
      let joined = false;
      
      while (retryCount < maxRetries && !joined) {
        try {
         
          
          // For retries, create a new call object and wait longer
          if (retryCount > 0) {
            try {
             
              
              // Complete cleanup of previous attempt
              if (this.currentCall) {
                try {
                  // Try to leave the call first
                  await this.currentCall.leave().catch(e => {
                   
                  });
                } catch (leaveError) {
                 
                }
              }
              
              // Wait between retries
              const waitTime = 1000 * retryCount;
             
              await new Promise(resolve => setTimeout(resolve, waitTime));
              
              // Create a fresh call object for this attempt
              this.currentCall = this.client.call(callType as string, callId);
            } catch (cleanupError) {
             
            }
          }
          
          // Try joining the call
          try {
            await this.currentCall.join({ create: true });
           
            joined = true;
          } catch (joinError: any) {
            // Check for the "Illegal State" error which indicates we're already joined
            if (joinError.message && joinError.message.includes('Illegal State')) {

              
              // CRITICAL FIX: When we hit this error, the call object is likely in a weird state
              // Instead of using it directly, get a fresh call object
              try {
                // Get a fresh call object
                this.currentCall = this.client.call(callType as string, callId);
                
                // Query the call state without joining again
                await this.currentCall.getOrCreate();
                
                // If we get here, we're successfully connected to the call
               
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
             
              
              // Success! We're done
              break;
            } else {
             
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
  async callUser(receiverId: string, receiverName?: string, durationInMinutes: number = DEFAULT_CALL_LIMIT) {
    try {
      // Ensure we're initialized first
      if (!this.client || !this.currentUser) {
        throw new Error('Stream client not initialized');
      }
      
      console.log(`Starting call with ${durationInMinutes} minutes duration`);
      
      // Always create call with duration
      const response = await post('/api/v1/call/user-with-duration', {
        receiverId,
        durationInMinutes
      });
      
      const { streamCallId, callId, durationInMinutes: responseDuration } = response.data.myData;
      
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
        receiverName,
        durationInMinutes: responseDuration || durationInMinutes
      });
      
      return {
        callId,
        streamCallId,
        call: this.currentCall,
        durationInMinutes: responseDuration || durationInMinutes
      };
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }
  
  /**
   * End the current call with improved error handling
   */
  async endCall() {
    try {
      if (this.currentCall) {
        // Disable media before ending
        if (this.currentCall.camera) {
          await this.currentCall.camera.disable();
        }
        if (this.currentCall.microphone) {
          await this.currentCall.microphone.disable();
        }
        
        // Leave the call
        await this.currentCall.leave();
        
        // End the call on the server
        await this.currentCall.endCall();
        
        this.currentCall = null;
        console.log('Call ended successfully');
      }
    } catch (error: any) {
      console.error('Error ending call:', error);
      this.currentCall = null;
      
      // **FIX**: Don't throw error if call was already left
      if (error.message?.includes('Cannot leave call that has already been left')) {
        console.log('Call was already ended by another participant');
        return;
      }
      
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

  /**
   * Get a call duration manager for the current call
   */
  createDurationManager(callId: string, callbacks?: {
    onTimerUpdate?: (remainingSeconds: number) => void;
    onWarningReceived?: (event: any) => void;
    onCallExtended?: (event: any) => void;
    onCallEnded?: () => void;
  }) {
    if (!this.currentCall) {
      throw new Error('No active call to manage duration for');
    }
    
    // Import here to avoid circular dependencies
    const { CallDurationManager } = require('../../utils/callDurationManager');
    
    return new CallDurationManager(this.currentCall, callId, callbacks);
  }
}

// Create singleton instance
const streamService = new StreamService();
export default streamService;

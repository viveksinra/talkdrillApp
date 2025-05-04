import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream
} from 'react-native-webrtc';
import socketService from './socketService';

// ICE server configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;

  // Initialize WebRTC with signaling room
  async initialize(roomId: string, onRemoteStream: (stream: MediaStream) => void) {
    try {
      this.roomId = roomId;
      this.onRemoteStreamCallback = onRemoteStream;
      
      // Create peer connection
      this.peerConnection = new RTCPeerConnection(configuration);
      
      // Get local media stream
      this.localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      // Add local tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
      
      // Handle incoming tracks (remote stream)
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      };
      
      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.roomId) {
          socketService.sendIceCandidate(this.roomId, event.candidate);
        }
      };
      
      // Set up socket event listeners
      socketService.onCallEvent('offer', async (offer) => {
        await this.handleOffer(offer);
      });
      
      socketService.onCallEvent('answer', async (answer) => {
        await this.handleAnswer(answer);
      });
      
      socketService.onCallEvent('ice-candidate', async (candidate) => {
        await this.addIceCandidate(candidate);
      });
      
      // Join signaling room
      socketService.joinRoom(roomId);
      
      return this.localStream;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
    }
  }
  
  // Create and send offer
  async createOffer() {
    try {
      if (!this.peerConnection || !this.roomId) {
        throw new Error('WebRTC not initialized');
      }
      
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      socketService.sendOffer(this.roomId, offer);
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }
  
  // Handle incoming offer
  async handleOffer(offer: RTCSessionDescription) {
    try {
      if (!this.peerConnection || !this.roomId) {
        throw new Error('WebRTC not initialized');
      }
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      socketService.sendAnswer(this.roomId, answer);
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }
  
  // Handle incoming answer
  async handleAnswer(answer: RTCSessionDescription) {
    try {
      if (!this.peerConnection) {
        throw new Error('WebRTC not initialized');
      }
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }
  
  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidate) {
    try {
      if (!this.peerConnection) {
        throw new Error('WebRTC not initialized');
      }
      
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }
  
  // Clean up WebRTC connection
  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.roomId) {
      socketService.leaveRoom(this.roomId);
      this.roomId = null;
    }
    
    this.remoteStream = null;
    this.onRemoteStreamCallback = null;
  }
  
  // Get local stream
  getLocalStream() {
    return this.localStream;
  }
  
  // Get remote stream
  getRemoteStream() {
    return this.remoteStream;
  }
}

export default WebRTCService; 
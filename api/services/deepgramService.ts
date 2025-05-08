import { Deepgram } from '@deepgram/sdk';
import socketService from './socketService';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';

class DeepgramService {
  private deepgramApiKey: string | null = null;
  private userId: string | null = null;
  private callId: string | null = null;
  private isMicrophoneActive: boolean = false;
  private recording: Audio.Recording | null = null;
  private audioPlayer: Audio.Sound | null = null;
  private onTranscriptCallback: ((text: string) => void) | null = null;

  // Initialize Deepgram with API key
  initialize(apiKey: string, userId: string, callId: string, onTranscript: (text: string) => void) {
    try {
      this.deepgramApiKey = apiKey;
      this.userId = userId;
      this.callId = callId;
      this.onTranscriptCallback = onTranscript;
      
      // Set up socket event listener for AI responses
      socketService.onCallEvent('ai-response', async (data) => {
        if (data.callId === this.callId) {
          await this.playAIResponse(data.message);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing Deepgram:', error);
      return false;
    }
  }
  
  // Start listening to microphone
  async startListening() {
    try {
      if (!this.deepgramApiKey || !this.userId || !this.callId) {
        throw new Error('Deepgram not initialized');
      }
      
      if (this.isMicrophoneActive) {
        await this.stopListening();
      }
      
      // Get microphone permission
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission not granted');
      }
      
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      
      // Create and prepare recording instance
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });
      
      // Start recording
      await this.recording.startAsync();
      this.isMicrophoneActive = true;
      
      // Set up interval to process audio data chunks
      const processInterval = setInterval(async () => {
        if (!this.isMicrophoneActive || !this.recording) {
          clearInterval(processInterval);
          return;
        }
        
        try {
          // Stop recording temporarily
          await this.recording.stopAndUnloadAsync();
          
          // Get recorded URI
          const uri = this.recording.getURI();
          if (!uri) {
            throw new Error('No recording URI available');
          }
          
          // Process audio with Deepgram on the server
          // We'll send the audio file path to the server and let it handle the Deepgram API call
          this.processAudioChunk(uri);
          
          // Start a new recording
          this.recording = new Audio.Recording();
          await this.recording.prepareToRecordAsync({
            android: {
              extension: '.wav',
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 128000,
            },
            ios: {
              extension: '.wav',
              outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
          });
          
          await this.recording.startAsync();
        } catch (error) {
          console.error('Error processing audio chunk:', error);
        }
      }, 5000); // Process every 5 seconds
      
      return true;
    } catch (error) {
      console.error('Error starting microphone:', error);
      this.isMicrophoneActive = false;
      return false;
    }
  }
  
  // Process audio chunk and get transcription
  private async processAudioChunk(audioUri: string) {
    try {
      // In a real implementation, we would upload this file to our server
      // which would then use Deepgram to transcribe it
      
      // For this example, we'll simulate receiving a transcription after a delay
      setTimeout(() => {
        // Simulate transcription (in a real app, this would come from the server)
        const mockTranscription = "This is a simulated transcription from audio.";
        
        // Send to callback
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback(mockTranscription);
        }
        
        // Send to server for AI response
        if (this.userId && this.callId) {
          socketService.sendAITranscription(this.userId, this.callId, mockTranscription);
        }
      }, 1000);
      
      // Alternative: Use fetch to send the audio file to our backend
      /*
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'audio.wav',
      });
      formData.append('userId', this.userId);
      formData.append('callId', this.callId);
      
      fetch('your-server-url/api/v1/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      */
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  }
  
  // Stop listening
  async stopListening() {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      
      this.isMicrophoneActive = false;
      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return false;
    }
  }
  
  // Play AI response using text-to-speech
  async playAIResponse(text: string) {
    try {
      if (this.audioPlayer) {
        await this.audioPlayer.unloadAsync();
      }
      
      // In a real implementation, you'd use a text-to-speech service
      console.log("AI response:", text);
      
      // Mock playing audio response
      // In a real app, you would use a TTS service or pre-recorded audio
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/sounds/notification.mp3')
        );
        this.audioPlayer = sound;
        await sound.playAsync();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error playing AI response:', error);
      return false;
    }
  }
  
  // Clean up resources
  cleanup() {
    this.stopListening();
    
    if (this.audioPlayer) {
      this.audioPlayer.unloadAsync();
      this.audioPlayer = null;
    }
    
    this.userId = null;
    this.callId = null;
    this.onTranscriptCallback = null;
  }
}

export default DeepgramService; 
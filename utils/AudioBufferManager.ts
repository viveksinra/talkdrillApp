import { Audio } from 'expo-av';
import { AudioOptimizer } from './AudioOptimization';

export class AudioBufferManager {
  private audioQueue: string[] = [];
  private isProcessingQueue: boolean = false;
  private currentSound: Audio.Sound | null = null;
  private sessionMetrics = {
    chunksProcessed: 0,
    totalLatency: 0,
    errors: 0,
    startTime: Date.now()
  };

  constructor() {
    this.setupAudioMode();
  }

  private async setupAudioMode() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }

  async addChunk(base64Audio: string) {
    const startTime = Date.now();
    
    try {
      // Use AudioOptimizer to check if we should buffer this chunk
      if (!AudioOptimizer.shouldBufferChunk(this.audioQueue.length)) {
        console.warn('[AudioBuffer] Queue full, dropping chunk');
        this.sessionMetrics.errors++;
        return;
      }

      // Optimize the audio chunk
      const optimizedChunk = AudioOptimizer.optimizeAudioChunk(base64Audio);
      
      this.audioQueue.push(optimizedChunk);
      this.sessionMetrics.chunksProcessed++;
      
      if (!this.isProcessingQueue) {
        this.processAudioQueue();
      }
      
      // Track latency
      const latency = Date.now() - startTime;
      this.sessionMetrics.totalLatency += latency;
      
    } catch (error) {
      console.error('[AudioBuffer] Error adding chunk:', error);
      this.sessionMetrics.errors++;
    }
  }

  private async processAudioQueue() {
    if (this.audioQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.audioQueue.length > 0) {
      const chunk = this.audioQueue.shift();
      if (chunk) {
        await this.playChunk(chunk);
      }
    }
    
    this.isProcessingQueue = false;
  }

  private async playChunk(base64Audio: string): Promise<void> {
    const chunkStartTime = Date.now();
    
    try {
      // Convert base64 PCM16 to playable audio format
      const audioUri = this.convertPCM16ToPlayableFormat(base64Audio);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        }
      );
      
      this.currentSound = sound;
      
      return new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            const chunkLatency = Date.now() - chunkStartTime;
            console.log(`[AudioBuffer] Chunk played in ${chunkLatency}ms`);
            sound.unloadAsync().then(() => resolve());
          }
        });
        
        // Fallback timeout
        setTimeout(() => {
          sound.unloadAsync().then(() => resolve());
        }, 5000);
      });
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      this.sessionMetrics.errors++;
    }
  }

  private convertPCM16ToPlayableFormat(base64PCM: string): string {
    // For real implementation, you might need to convert PCM16 to WAV format
    // This is a simplified approach - you may need to add proper WAV headers
    return `data:audio/wav;base64,${base64PCM}`;
  }

  getSessionMetrics() {
    const duration = Date.now() - this.sessionMetrics.startTime;
    const averageLatency = this.sessionMetrics.chunksProcessed > 0 
      ? this.sessionMetrics.totalLatency / this.sessionMetrics.chunksProcessed 
      : 0;
      
    return {
      duration,
      audioChunks: this.sessionMetrics.chunksProcessed,
      averageLatency,
      errorCount: this.sessionMetrics.errors,
      queueSize: this.audioQueue.length
    };
  }

  async cleanup() {
    // Log session metrics before cleanup
    const metrics = this.getSessionMetrics();
    console.log('[AudioBuffer] Session metrics:', metrics);
    
    this.audioQueue = [];
    this.isProcessingQueue = false;
    
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.warn('Error during audio cleanup:', error);
      }
      this.currentSound = null;
    }
    
    // Reset metrics
    this.sessionMetrics = {
      chunksProcessed: 0,
      totalLatency: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  async stop() {
    this.audioQueue = [];
    if (this.currentSound) {
      await this.currentSound.stopAsync();
    }
  }
} 
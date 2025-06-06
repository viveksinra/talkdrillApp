import { Audio } from 'expo-av';
import { AudioOptimizer } from './AudioOptimization';
import { Buffer } from 'buffer';

export class AudioBufferManager {
  private audioChunks: string[] = [];
  private isPlaying: boolean = false;
  private currentSound: Audio.Sound | null = null;
  private mergeTimer: NodeJS.Timeout | null = null;
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
      // Optimize the audio chunk
      const optimizedChunk = AudioOptimizer.optimizeAudioChunk(base64Audio);
      
      this.audioChunks.push(optimizedChunk);
      this.sessionMetrics.chunksProcessed++;
      
      // Clear existing timer
      if (this.mergeTimer) {
        clearTimeout(this.mergeTimer);
      }
      
      // Set a timer to wait for more chunks before playing
      // This allows us to collect multiple chunks and merge them
      this.mergeTimer = setTimeout(() => {
        this.playMergedAudio(this.audioChunks);
      }, 500); // Wait 500ms for more chunks
      
      // Track latency
      const latency = Date.now() - startTime;
      this.sessionMetrics.totalLatency += latency;
      
    } catch (error) {
      console.error('[AudioBuffer] Error adding chunk:', error);
      this.sessionMetrics.errors++;
    }
  }

  async playMergedAudio(audioChunks: string[]) {
    if (audioChunks.length === 0) return;
    
    console.log(`[AudioBuffer] Playing merged audio with ${audioChunks.length} chunks`);
    
    try {
      // Merge all chunks into a single audio
      const mergedAudio = this.mergeAudioChunks(audioChunks);
      
      // before to play an audio please check if any existing audio is playing
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      }
      
      // Play the merged audio
      await this.playAudio(mergedAudio);
      
      console.log('[AudioBuffer] Merged audio playback complete');
    } catch (error) {
      console.error('[AudioBuffer] Error playing merged audio:', error);
      this.sessionMetrics.errors++;
    }
  }

  private mergeAudioChunks(chunks: string[]): string {
    // Decode all chunks to PCM buffers
    const pcmBuffers = chunks.map(chunk => Buffer.from(chunk, 'base64'));
    
    // Calculate total length
    const totalLength = pcmBuffers.reduce((sum, buf) => sum + buf.length, 0);
    
    // Create merged buffer
    const mergedPCM = Buffer.concat(pcmBuffers, totalLength);
    
    // Convert to base64
    return mergedPCM.toString('base64');
  }

  private async playAudio(base64Audio: string): Promise<void> {
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
            console.log(`[AudioBuffer] Audio played in ${chunkLatency}ms`);
            sound.unloadAsync().then(() => resolve());
          }
        });
        
        // Fallback timeout based on audio duration
        const duration = base64Audio.length / 1000 * 100; // Rough estimate
        setTimeout(() => {
          sound.unloadAsync().then(() => resolve());
        }, Math.max(5000, duration));
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      this.sessionMetrics.errors++;
    }
  }

  /**
   * OpenAI realtime returns raw PCM-16 (mono, 16 kHz).  
   * To make it playable we prepend a 44-byte WAV header.
   */
  private convertPCM16ToPlayableFormat(base64PCM: string): string {
    const pcmBuf = Buffer.from(base64PCM, 'base64');
    
    const numChannels   = 1;
    const sampleRate    = 16_000;
    const bitsPerSample = 16;
    const byteRate      = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign    = numChannels * (bitsPerSample / 8);
    const dataSize      = pcmBuf.length;
    const riffSize      = 36 + dataSize;

    const wavBuf = Buffer.alloc(44 + dataSize);
    wavBuf.write('RIFF', 0);                 // ChunkID
    wavBuf.writeUInt32LE(riffSize, 4);       // ChunkSize
    wavBuf.write('WAVE', 8);                 // Format
    wavBuf.write('fmt ', 12);                // Subchunk1ID
    wavBuf.writeUInt32LE(16, 16);            // Subchunk1Size (PCM)
    wavBuf.writeUInt16LE(1, 20);             // AudioFormat (PCM)
    wavBuf.writeUInt16LE(numChannels, 22);   // NumChannels
    wavBuf.writeUInt32LE(sampleRate, 24);    // SampleRate
    wavBuf.writeUInt32LE(byteRate, 28);      // ByteRate
    wavBuf.writeUInt16LE(blockAlign, 32);    // BlockAlign
    wavBuf.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
    wavBuf.write('data', 36);                // Subchunk2ID
    wavBuf.writeUInt32LE(dataSize, 40);      // Subchunk2Size
    pcmBuf.copy(wavBuf, 44);                 // PCM payload
    
    return `data:audio/wav;base64,${wavBuf.toString('base64')}`;
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
      queueSize: this.audioChunks.length
    };
  }

  async cleanup() {
    // Clear any pending timer
    if (this.mergeTimer) {
      clearTimeout(this.mergeTimer);
      this.mergeTimer = null;
    }
    
    // Log session metrics before cleanup
    const metrics = this.getSessionMetrics();
    console.log('[AudioBuffer] Session metrics:', metrics);
    
    this.audioChunks = [];
    this.isPlaying = false;
    
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
    if (this.mergeTimer) {
      clearTimeout(this.mergeTimer);
      this.mergeTimer = null;
    }
    
    this.audioChunks = [];
    this.isPlaying = false;
    
    if (this.currentSound) {
      await this.currentSound.stopAsync();
    }
  }
} 
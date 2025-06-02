// utils/AudioQueueManager.ts
import { Audio, AVPlaybackStatus } from 'expo-av';

interface QueuedAudio {
  id: number;
  chunkIndex: number;
  uri: string;
  timestamp: number;
}

class AudioQueueManager {
  private queue: QueuedAudio[] = [];
  private currentSound: Audio.Sound | null = null;
  private isPlaying = false;
  private currentId = 0;
  private nextExpectedChunk = 0;
  private playbackPromises: Map<number, () => void> = new Map();

  public async addToQueue(uri: string, chunkIndex: number): Promise<number> {
    const id = this.currentId++;
    const queuedAudio: QueuedAudio = { 
      id, 
      chunkIndex,
      uri, 
      timestamp: Date.now() 
    };
    
    // Insert in order based on chunkIndex
    let insertIndex = this.queue.findIndex(item => item.chunkIndex > chunkIndex);
    if (insertIndex === -1) {
      this.queue.push(queuedAudio);
    } else {
      this.queue.splice(insertIndex, 0, queuedAudio);
    }
    
    console.log(`[AudioQueue] Added chunk ${chunkIndex} to queue, size: ${this.queue.length}`);

    if (!this.isPlaying) {
      this.playNext();
    }

    return id;
  }

  private async playNext() {
    if (this.queue.length === 0 || this.isPlaying) {
      return;
    }

    // Check if the next expected chunk is available
    const nextChunkIndex = this.queue.findIndex(item => item.chunkIndex === this.nextExpectedChunk);
    if (nextChunkIndex === -1) {
      console.log(`[AudioQueue] Waiting for chunk ${this.nextExpectedChunk}...`);
      return;
    }

    const { id, chunkIndex, uri } = this.queue[nextChunkIndex];
    this.isPlaying = true;
    
    // Remove the chunk we're about to play from the queue
    this.queue.splice(nextChunkIndex, 1);
    this.nextExpectedChunk = chunkIndex + 1;

    try {
      console.log(`[AudioQueue] Playing chunk ${chunkIndex}`);
      
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      this.currentSound = sound;

      return new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            // Handle error case
            if (status.error) {
              console.error(`[AudioQueue] Playback error for chunk ${chunkIndex}:`, status.error);
              resolve();
              this.onPlaybackComplete();
            }
            return;
          }
          
          // Handle success case
          if (status.didJustFinish) {
            console.log(`[AudioQueue] Finished playing chunk ${chunkIndex}`);
            resolve();
            this.onPlaybackComplete();
          }
        });

        sound.playAsync().catch(error => {
          console.error(`[AudioQueue] Error playing chunk ${chunkIndex}:`, error);
          resolve();
          this.onPlaybackComplete();
        });
      });
    } catch (error) {
      console.error(`[AudioQueue] Error with chunk ${chunkIndex}:`, error);
      this.onPlaybackComplete();
    }
  }

  private onPlaybackComplete() {
    this.isPlaying = false;
    
    // Process next chunk in queue
    this.playNext();
  }

  public async cleanup() {
    if (this.currentSound) {
      await this.currentSound.unloadAsync();
      this.currentSound = null;
    }
    this.queue = [];
    this.isPlaying = false;
    this.nextExpectedChunk = 0;
    this.playbackPromises.clear();
  }

  public async stop() {
    if (this.currentSound) {
      await this.currentSound.stopAsync();
      await this.currentSound.unloadAsync();
      this.currentSound = null;
    }
    this.isPlaying = false;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }
}

export const audioQueue = new AudioQueueManager();
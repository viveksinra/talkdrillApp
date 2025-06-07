export class AudioOptimizer {
  private static readonly CHUNK_SIZE = 1024; // Optimal chunk size for streaming
  private static readonly MAX_BUFFER_SIZE = 10; // Maximum chunks to buffer
  private static readonly MIN_CHUNK_SIZE = 512; // Minimum viable chunk size
  private static readonly COMPRESSION_THRESHOLD = 2048; // When to apply compression

  static optimizeAudioChunk(base64Audio: string): string {
    if (!base64Audio || base64Audio.length === 0) {
      return base64Audio;
    }

    try {
      // If chunk is too large, apply basic optimization
      if (base64Audio.length > this.COMPRESSION_THRESHOLD) {
        return this.compressAudioChunk(base64Audio);
      }

      // If chunk is too small, it might cause playback issues
      if (base64Audio.length < this.MIN_CHUNK_SIZE) {
        console.warn('[AudioOptimizer] Chunk smaller than minimum size');
      }

      return base64Audio;
    } catch (error) {
      console.error('[AudioOptimizer] Error optimizing chunk:', error);
      return base64Audio; // Return original if optimization fails
    }
  }

  private static compressAudioChunk(base64Audio: string): string {
    // Basic compression by removing padding if present
    // In a real implementation, you might use actual audio compression
    try {
      // Remove any padding characters that might have been added
      let optimized = base64Audio.replace(/=+$/, '');
      
      // Ensure proper base64 padding
      while (optimized.length % 4) {
        optimized += '=';
      }
      
      return optimized;
    } catch (error) {
      console.error('[AudioOptimizer] Compression failed:', error);
      return base64Audio;
    }
  }

  static shouldBufferChunk(currentBufferSize: number): boolean {
    return currentBufferSize < this.MAX_BUFFER_SIZE;
  }

  static getOptimalChunkSize(): number {
    return this.CHUNK_SIZE;
  }

  static validateAudioChunk(base64Audio: string): boolean {
    if (!base64Audio) return false;
    
    try {
      // Basic base64 validation
      const decoded = atob(base64Audio.replace(/[^A-Za-z0-9+/]/g, ''));
      return decoded.length > 0;
    } catch (error) {
      console.error('[AudioOptimizer] Invalid audio chunk:', error);
      return false;
    }
  }

  static calculateChunkMetrics(base64Audio: string) {
    return {
      size: base64Audio.length,
      isValid: this.validateAudioChunk(base64Audio),
      needsOptimization: base64Audio.length > this.COMPRESSION_THRESHOLD,
      isTooSmall: base64Audio.length < this.MIN_CHUNK_SIZE
    };
  }
} 
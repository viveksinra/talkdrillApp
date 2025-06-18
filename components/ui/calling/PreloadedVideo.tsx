import React, { useState, useEffect, useRef } from 'react';
import { Video, ResizeMode } from 'expo-av';
import { StyleSheet } from 'react-native';

interface PreloadedVideoProps {
  source: any;
  isVisible: boolean;
  onReady: () => void;
  onError: (error: any) => void;
  videoType: 'idle' | 'speech';
  isFullScreen?: boolean;
}

export const PreloadedVideo: React.FC<PreloadedVideoProps> = ({ 
  source, 
  isVisible, 
  onReady, 
  onError,
  videoType,
  isFullScreen = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<Video>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLoad = (status: any) => {
    console.log(`[VIDEO-${videoType.toUpperCase()}] Loaded successfully:`, status);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsLoaded(true);
    onReady();
  };

  const handleError = (error: any) => {
    console.error(`[VIDEO-${videoType.toUpperCase()}] Error loading video:`, error);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setHasError(true);
    onError(error);
  };

  useEffect(() => {
    console.log(`[VIDEO-${videoType.toUpperCase()}] Starting to load video from:`, source.uri);
    
    timeoutRef.current = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.error(`[VIDEO-${videoType.toUpperCase()}] Timeout: Video failed to load within 30 seconds`);
        handleError(new Error('Video loading timeout'));
      }
    }, 30000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [source.uri, isLoaded, hasError, videoType]);

  return (
    <Video
      ref={videoRef}
      source={source}
      style={[
        styles.video,
        {
          opacity: isVisible && isLoaded && !hasError ? 1 : 0,
          zIndex: isVisible && isLoaded && !hasError ? 1 : -1,
        }
      ]}
      shouldPlay={isVisible && isLoaded && !hasError}
      isLooping={true}
      resizeMode={isFullScreen ? ResizeMode.COVER : ResizeMode.CONTAIN}
      onLoad={handleLoad}
      onError={handleError}
      volume={0}
      useNativeControls={false}
      progressUpdateIntervalMillis={16}
    />
  );
};

const styles = StyleSheet.create({
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
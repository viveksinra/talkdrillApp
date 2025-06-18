import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { PreloadedVideo } from '@/components/ui/calling/PreloadedVideo';

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  profileImage: string;
  idleVideoUrl?: string;
  speechVideoUrl?: string;
}

interface AICharacterVideoProps {
  isAudioPlaying: boolean;
  character: AICharacter;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: (error: any) => void;
  isFullScreen?: boolean;
}

export const AICharacterVideo: React.FC<AICharacterVideoProps> = ({ 
  isAudioPlaying, 
  character,
  onLoadStart, 
  onLoad, 
  onError,
  isFullScreen = false
}) => {
  const [idleVideoReady, setIdleVideoReady] = useState(false);
  const [speechVideoReady, setSpeechVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const hasVideoUrls = character.idleVideoUrl && character.speechVideoUrl;
  const bothVideosReady = hasVideoUrls ? (idleVideoReady && speechVideoReady) : false;

  useEffect(() => {
    console.log('[VIDEO-STATE] State update:', {
      idleVideoReady,
      speechVideoReady,
      bothVideosReady,
      hasError
    });
  }, [idleVideoReady, speechVideoReady, bothVideosReady, hasError]);

  useEffect(() => {
    if (bothVideosReady) {
      console.log('[VIDEO] Both videos preloaded and ready! Calling parent onLoad...');
      onLoad?.();
    }
  }, [bothVideosReady, onLoad]);

  useEffect(() => {
    if (hasVideoUrls) {
      console.log('[VIDEO] Starting video preload process...');
      onLoadStart?.();
    } else {
      console.log('[VIDEO] No video URLs available, will use avatar mode');
      setHasError(true);
      onError?.(new Error('No video URLs available'));
    }
  }, [hasVideoUrls, onLoadStart, onError]);

  const handleVideoError = (error: any) => {
    setHasError(true);
    onError?.(error);
  };

  if (!hasVideoUrls) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!bothVideosReady && !hasError && (
        <View style={styles.loadingContainer}>
          <CircularProgress size={40} color={Colors.light.primary} />
          <Text style={styles.loadingText}>
            Preparing videos... ({idleVideoReady ? '1' : '0'}/2 ready)
          </Text>
        </View>
      )}
      
      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={40} color="#F44336" />
          <Text style={styles.errorText}>Video unavailable</Text>
        </View>
      )}
      
      <PreloadedVideo
        source={{ uri: character.idleVideoUrl! }}
        isVisible={!isAudioPlaying && bothVideosReady}
        onReady={() => {
          console.log('[VIDEO-IDLE] Individual video ready');
          setIdleVideoReady(true);
        }}
        onError={handleVideoError}
        videoType="idle"
        isFullScreen={isFullScreen}
      />
      
      <PreloadedVideo
        source={{ uri: character.speechVideoUrl! }}
        isVisible={isAudioPlaying && bothVideosReady}
        onReady={() => {
          console.log('[VIDEO-SPEECH] Individual video ready');
          setSpeechVideoReady(true);
        }}
        onError={handleVideoError}
        videoType="speech"
        isFullScreen={isFullScreen}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
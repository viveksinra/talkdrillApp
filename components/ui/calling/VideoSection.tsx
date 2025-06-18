import React from 'react';
import { View, TouchableOpacity, Image, Animated, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { AICharacterVideo } from '@/components/ui/calling/AICharacterVideo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT / 3;

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  profileImage: string;
  idleVideoUrl?: string;
  speechVideoUrl?: string;
}

interface VideoSectionProps {
  character: AICharacter;
  isAudioPlaying: boolean;
  videosReady: boolean;
  videosFailed: boolean;
  isFullScreen: boolean;
  fullScreenAnimation: Animated.Value;
  toggleFullScreen: () => void;
  handleVideoLoadStart: () => void;
  handleVideoLoad: () => void;
  handleVideoError: (error: any) => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  character,
  isAudioPlaying,
  videosReady,
  videosFailed,
  isFullScreen,
  fullScreenAnimation,
  toggleFullScreen,
  handleVideoLoadStart,
  handleVideoLoad,
  handleVideoError
}) => {
  const videoHeight = fullScreenAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [VIDEO_HEIGHT, SCREEN_HEIGHT],
  });

  if (videosFailed) {
    // Fallback to avatar UI when videos fail
    return (
      <Animated.View style={[
        styles.avatarSection,
        { height: isFullScreen ? SCREEN_HEIGHT : VIDEO_HEIGHT }
      ]}>
        <View style={styles.avatarContainer}>
          {character.profileImage ? (
            <Image
              source={{ uri: character.profileImage }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.characterAvatarPlaceholder}>
              <Ionicons
                name="person"
                size={60}
                color={Colors.light.primary}
              />
            </View>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.videoSection,
      { height: videoHeight }
    ]}>
      <AICharacterVideo
        isAudioPlaying={isAudioPlaying}
        character={character}
        onLoadStart={handleVideoLoadStart}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
        isFullScreen={isFullScreen}
      />
      
      {/* Full screen toggle button */}
      {!isFullScreen && (
        <TouchableOpacity
          style={styles.fullScreenButton}
          onPress={toggleFullScreen}
        >
          <Ionicons name="expand" size={24} color="white" />
        </TouchableOpacity>
      )}
      
      {/* Exit full screen button */}
      {isFullScreen && (
        <TouchableOpacity
          style={styles.exitFullScreenButton}
          onPress={toggleFullScreen}
        >
          <Ionicons name="contract" size={24} color="white" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  videoSection: {
    height: VIDEO_HEIGHT,
    backgroundColor: "#000",
    position: "relative",
  },
  avatarSection: {
    height: VIDEO_HEIGHT,
    backgroundColor: "#155269",
    position: "relative",
  },
  avatarContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  characterAvatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
    zIndex: 20,
  },
  exitFullScreenButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
    zIndex: 20,
  },
});
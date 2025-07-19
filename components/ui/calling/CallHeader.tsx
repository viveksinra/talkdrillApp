import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { ThemedText } from '../../ThemedText';

interface CallHeaderProps {
  characterName: string;
  characterAvatar: string;
  connectionStatus: string;
  isConnected: boolean;
  videosReady: boolean;
  videosFailed: boolean;
  isAIResponding: boolean;
  isAudioPlaying: boolean;
}

export const CallHeader: React.FC<CallHeaderProps> = ({
  characterName,
  characterAvatar,
  connectionStatus,
  isConnected,
  videosReady,
  videosFailed,
  isAIResponding,
  isAudioPlaying
}) => {
  // Determine system readiness status
  const videoSystemReady = videosReady || videosFailed;
  const systemReady = isConnected && videoSystemReady;
  const statusColor = systemReady ? "#4CAF50" : "#F44336";
  
  // Determine display status with priority order
  let displayStatus = connectionStatus;
  
  if (!isConnected) {
    displayStatus = connectionStatus;
  } else if (isAudioPlaying) {
    displayStatus = "AI Speaking...";
  } else if (videosReady) {
    displayStatus = "Ready To Talk";
  } else if (videosFailed) {
    displayStatus = "Ready (Avatar mode)";
  } else {
    displayStatus = "Loading AI...";
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: characterAvatar }}
        style={styles.avatar}
        onError={(error) =>
          console.error("Header avatar loading error:", error.nativeEvent.error)
        }
        defaultSource={{uri: 'https://talkdrill.s3.eu-west-2.amazonaws.com/manual/characterImage/char1.jpg'}}
      />
      <View>
        <ThemedText style={styles.name}>
          {characterName.length > 15 ? characterName.slice(0, 15) + "..." : characterName}
        </ThemedText>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: statusColor },
            ]}
          />
          <Text style={styles.statusText}>
            {displayStatus.length > 20
              ? displayStatus.substring(0, 20) + "..."
              : displayStatus}
          </Text>
          {/* {(isAIResponding || (!systemReady && isConnected)) && (
            <ActivityIndicator
              size="small"
              color={Colors.light.primary}
              style={styles.processingIndicator}
            />
          )} */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row", 
    alignItems: "center", 
    width: 200
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
  },
  statusText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  processingIndicator: {
    marginLeft: 2,
  },
});
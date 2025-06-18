import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { LoadingDots } from '../../shared/LoadingDot';

interface Message {
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  isChunk?: boolean;
  isLoading?: boolean;
  hidden?: boolean;
  audioData?: boolean;
  loadingType?: "voice_processing" | "text_generating";
}

interface MessageBubbleProps {
  message: Message;
  index: number;
  characterAvatar?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  index, 
  characterAvatar 
}) => {
  const isUser = message.sender === "user";

  // For user voice processing, show circular progress instead of message bubble
  if (message.isLoading && message.loadingType === "voice_processing" && isUser) {
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          styles.userMessage,
        ]}
      >
        <View style={styles.userLoadingContainer}>
          <CircularProgress size={40} color={Colors.light.primary} />
        </View>
      </View>
    );
  }

  return (
    <View
      key={index}
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {!isUser && characterAvatar && (
        <Image
          source={{ uri: characterAvatar }}
          style={styles.characterAvatar}
        />
      )}
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
          message.isChunk && styles.chunkBubble,
          message.isLoading && styles.loadingBubble,
        ]}
      >
        {message.isLoading && message.loadingType === "text_generating" ? (
          <View style={styles.messageLoadingContainer}>
            <LoadingDots />
          </View>
        ) : message.isLoading && message.loadingType === "voice_processing" ? (
          <View style={styles.messageLoadingContainer}>
            <LoadingDots />
          </View>
        ) : message.isLoading ? (
          <View style={styles.messageLoadingContainer}>
            <CircularProgress size={24} color={isUser ? "white" : Colors.light.primary} />
            <Text style={[
              styles.loadingMessageText,
              { color: isUser ? "white" : Colors.light.text }
            ]}>
              Generating response...
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userText : styles.aiText,
              ]}
            >
              {message.content}
            </Text>
            {message.audioData && (
              <View style={styles.audioIndicator}>
                <Ionicons
                  name="volume-medium"
                  size={16}
                  color={Colors.light.text}
                />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  characterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: Colors.light.primary,
    marginLeft: 40,
  },
  aiBubble: {
    backgroundColor: Colors.light.surface,
    marginRight: 40,
  },
  chunkBubble: {
    marginVertical: 2,
    padding: 8,
  },
  loadingBubble: {
    backgroundColor: Colors.light.surface,
    opacity: 0.9,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: "white",
  },
  aiText: {
    color: Colors.light.text,
  },
  messageLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  loadingMessageText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  userLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 40,
    paddingVertical: 8,
  },
  audioIndicator: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
});
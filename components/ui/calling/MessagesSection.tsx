import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { MessageBubble } from '@/components/ui/calling/MessageBubble';

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

interface MessagesSectionProps {
  messages: Message[];
  characterAvatar?: string;
  scrollViewRef: React.RefObject<ScrollView>;
}

export const MessagesSection: React.FC<MessagesSectionProps> = ({
  messages,
  characterAvatar,
  scrollViewRef
}) => {
  const hasMessages = messages && messages.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="book-outline" size={24} color="white" />
        <Text style={styles.sectionTitle}>Lecture Section</Text>
      </View>
      
      {hasMessages ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              index={index}
              characterAvatar={characterAvatar}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: Colors.light.secondaryDark,
    borderRadius: 8,
    margin: 8,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  messagesContainer: {
    flex: 1,
    margin: 8,
  },
  messagesContent: {
    paddingBottom: 150,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.text
  },
});
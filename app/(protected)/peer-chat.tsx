import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TranscriptItem } from '@/types';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { getChatHistory, sendMessage, markMessagesAsRead } from '@/api/services/chatService';

export default function PeerChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { joinRoom, leaveRoom, sendChatMessage, on, off } = useSocket();
  const { peerId, peerName, peerAvatar } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isCallRequested, setIsCallRequested] = useState(false);
  
  const roomId = `chat_${user?.id}_${peerId}`;
  
  // Load chat history and join chat room
  useEffect(() => {
    if (!user?.id || !peerId) return;
    
    console.log(`Joining room: ${roomId}`);
    // Join the chat room
    joinRoom(roomId);
    
    // Load chat history
    loadChatHistory();
    
    // Mark messages as read
    markAsRead();
    
    // Listen for new messages
    const handleNewMessage = (message: any) => {
      console.log('New message received:', message);
      setMessages(prev => [...prev, message]);
      // Scroll to bottom
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    };
    
    console.log('Setting up new_message listener');
    on('new_message', handleNewMessage);
    
    return () => {
      // Leave the chat room
      console.log(`Leaving room: ${roomId}`);
      leaveRoom(roomId);
      console.log('Removing new_message listener');
      off('new_message', handleNewMessage);
    };
  }, [user?.id, peerId]);
  
  const loadChatHistory = async () => {
    try {
      const response = await getChatHistory(peerId as string);
      setMessages(response.messages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };
  
  const markAsRead = async () => {
    try {
      await markMessagesAsRead(peerId as string);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  const handleSendMessage = async () => {
    if (message.trim() === '') return;
    
    try {
      // Create new message
      const newMessage = {
        sender: user?.id,
        receiver: peerId,
        text: message,
        createdAt: new Date(),
      };
      
      // Add to UI immediately
      setMessages([...messages, newMessage]);
      setMessage('');
      
      // Scroll to bottom
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
      
      // Send to API
      await sendMessage(peerId as string, message);
      
      // Send to socket for real-time updates
      sendChatMessage(roomId, newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleCallRequest = () => {
    // Navigate to call screen
    router.push({
      pathname: '/peer-call',
      params: { 
        peerId: peerId,
        peerName: peerName,
      }
    });
  };
  
  const handleEndSession = () => {
    // Show confirmation modal
    router.push({
      pathname: '/session-end-confirmation',
      params: { type: 'peer-chat' }
    });
  };
  
  const renderMessageItem = ({ item }: { item: any }) => {
    const isUser = item.sender === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.peerMessage
      ]}>
        {!isUser && (
          <Image
            source={{ uri: peerAvatar as string || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.peerBubble
        ]}>
          <ThemedText>{item.text}</ThemedText>
          <ThemedText style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
      </View>
    );
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: peerName as string || 'Chat',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={handleCallRequest}>
                <IconSymbol size={24} name="phone.fill" color="#4A86E8" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEndSession}>
                <IconSymbol size={24} name="xmark.circle.fill" color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          initialNumToRender={messages.length}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={message.trim() === ''}>
            <IconSymbol
              size={24}
              name="paperplane.fill"
              color={message.trim() === '' ? '#A8C1E5' : '#4A86E8'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  peerMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#ECF3FF',
    borderBottomRightRadius: 4,
  },
  peerBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
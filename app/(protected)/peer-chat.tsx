import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View, Alert} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useHeaderHeight } from '@react-navigation/elements';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TranscriptItem } from '@/types';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { getChatHistory, sendMessage, markMessagesAsRead } from '@/api/services/chatService';
import streamService  from '@/api/services/streamService';
import { Colors } from '@/constants/Colors';

export default function PeerChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const { joinRoom, leaveRoom, sendChatMessage, on, off, emit } = useSocket();
  const { peerId, peerName, peerAvatar } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isPeerOnline, setIsPeerOnline] = useState(onlineUsers.includes(peerId as string));

  // Create both possible room IDs to ensure messages are received in both directions
  const roomId1 = `chat_${user?.id}_${peerId}`;
  const roomId2 = `chat_${peerId}_${user?.id}`;

  // Load chat history and join chat room
  useEffect(() => {
    if (!user?.id || !peerId) return;

    console.log(`Joining rooms: ${roomId1} and ${roomId2}`);
    // Join both chat rooms to ensure we receive messages sent in either direction
    joinRoom(roomId1);
    joinRoom(roomId2);

    // Emit event to check peer status
    emit('check_peer_status', { peerId });

    // Load chat history
    loadChatHistory();

    // Mark messages as read
    markAsRead();

    // Listen for new messages - create a stable reference to the handler
    const handleNewMessage = (message: any) => {
      console.log('New message received:', message);

      setMessages(prev => {
        // Check if message already exists in the messages array to prevent duplicates
        const isDuplicate = prev.some(existingMsg =>
          existingMsg._id === message._id ||
          (existingMsg.text === message.text &&
           existingMsg.sender === message.sender &&
           // Compare date strings rather than date objects
           new Date(existingMsg.createdAt).getTime() === new Date(message.createdAt).getTime())
        );

        // Only add the message if it's not a duplicate
        if (!isDuplicate) {
          return [...prev, message];
        }
        return prev;
      });

      // Scroll to bottom with a slight delay to ensure rendering is complete
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    };

    const handlePeerStatus = (data: { peerId: string, isOnline: boolean }) => {
      console.log('Peer status received:', data);
      if (data.peerId === peerId) {
        setIsPeerOnline(onlineUsers.includes(peerId as string));
      }
    };

    console.log('Setting up new_message listener');
    on('new_message', handleNewMessage);
    console.log('Setting up peer_status listener');
    on('peer_status', handlePeerStatus);

    // Clear function to clean up when component unmounts or dependencies change
    return () => {
      // Leave the chat rooms
      console.log(`Leaving rooms: ${roomId1} and ${roomId2}`);
      leaveRoom(roomId1);
      leaveRoom(roomId2);
      console.log('Removing new_message listener');
      off('new_message', handleNewMessage);
      console.log('Removing peer_status listener');
      off('peer_status', handlePeerStatus);
    };
  }, [user?.id, peerId, roomId1, roomId2, joinRoom, leaveRoom, on, off, emit]);

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
        _id: `temp_${Date.now()}`, // Add a temporary ID to help with duplicate detection
      };

      // Clear the input field immediately
      setMessage('');

      // Add to UI immediately
      setMessages(prev => [...prev, newMessage]);

      // Scroll to bottom
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

      // Send to API
      const response = await sendMessage(peerId as string, message);

      // Send to socket for real-time updates - use both rooms to ensure delivery
      sendChatMessage(roomId1, newMessage);
      sendChatMessage(roomId2, newMessage);
    } catch (error) {
      console.log('Error sending message:', JSON.stringify(error));
      console.error('Error sending message:', error);
    }
  };

  const handleCallRequest = async () => {
    try {
      // Get Stream token
      const { token, apiKey } = await streamService.getToken();

      // Initialize Stream client
      //@ts-ignore
      await streamService.initialize(user?.id || '', token, apiKey);

      // Start call with peer
      //@ts-ignore
      const { callId, streamCallId } = await streamService.startCall(peerId as string);

      // Navigate to call screen
      router.push({
        pathname: '/peer-call',
        params: {
          peerId: peerId,
          callId: callId,
          streamCallId: streamCallId
        }
      });
    } catch (error) {
      console.error('Error requesting call:', error);
      Alert.alert('Error', 'Could not initiate the call. Please try again.');
    }
  };

  const handleEndSession = () => {
    // Show confirmation modal
    router.push({
      pathname: '/session-end-confirmation',
      params: { type: 'peer-chat' }
    });
  };

  const getImageSource = (imagePath: string) => {
    if (!imagePath) {
      return require('@/assets/images/default-avatar-1.jpg');
    }
    // If it's a remote URL
    if (imagePath.startsWith('http')) {
      return { uri: imagePath };
    }
    // If it's a local path
    if (imagePath.includes('default-avatar')) {
      // Extract the avatar number and use require
      const avatarNumber = imagePath.match(/default-avatar-(\d+)/)?.[1] || '1';
      switch (avatarNumber) {
        case '1': return require('@/assets/images/default-avatar-1.jpg');
        case '2': return require('@/assets/images/default-avatar-2.jpg');
        case '3': return require('@/assets/images/default-avatar-3.jpg');
        case '4': return require('@/assets/images/default-avatar-4.jpg');
        case '5': return require('@/assets/images/default-avatar-5.jpg');
        default: return require('@/assets/images/default-avatar-1.jpg');
      }
    }
    // Fallback to default avatar if path is invalid
    return require('@/assets/images/default-avatar-1.jpg');
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
            source={getImageSource(peerAvatar as string)}
            style={styles.avatar}
            onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
            defaultSource={require('@/assets/images/default-avatar-1.jpg')} // Add a local fallback image
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

  const HeaderTitleWithAvatar = () => (
    <View style={styles.headerTitleContainer}>
      <Image
        source={getImageSource(peerAvatar as string)}
        style={styles.headerAvatar}
        onError={(error) => console.error('Header avatar loading error:', error.nativeEvent.error)}
        defaultSource={require('@/assets/images/default-avatar-1.jpg')}
      />
      <View>
        <ThemedText style={styles.headerName}>{peerName as string || 'Chat'}</ThemedText>
        <ThemedText style={isPeerOnline ? styles.onlineStatus : styles.offlineStatus}>
          {onlineUsers.includes(peerId as string) ? 'Online' : 'Offline'}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => <HeaderTitleWithAvatar />,
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
        behavior={'padding'}
        keyboardVerticalOffset={headerHeight}
        >

        <FlatList
          ref={flatListRef}
          data={messages}
          style={{flex: 1}}
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
  },
  onlineStatus: {
    fontSize: 12,
    color: "#4CD964", // Or your preferred online color
  },
  offlineStatus: {
    fontSize: 12,
    color: "#8E8E93", // Or your preferred offline color
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
    backgroundColor: '#FFF2EB',
    borderBottomRightRadius: 4,
  },
  peerBubble: {
    backgroundColor: Colors.light.surface,
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    minHeight: Platform.OS === 'ios' ? 120 : 100,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    height: Platform.OS === 'ios' ? 80 : 60,
    marginLeft: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 44, // Slightly larger touch target
    height: 44, // Slightly larger touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TranscriptItem } from '@/types';

export default function PeerChatScreen() {
  const router = useRouter();
  const { level, gender, teacher, random } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<TranscriptItem[]>([]);
  const [peer, setPeer] = useState({
    id: 'peer1',
    name: 'Alex',
    avatar: 'https://via.placeholder.com/100',
    level: level || 'intermediate'
  });
  const [isCallRequested, setIsCallRequested] = useState(false);
  
  // Mock peer connection
  useEffect(() => {
    // In a real app, connect to a peer
    
    // Add system message
    setMessages([
      {
        id: 'system-1',
        speaker: 'ai', // Using AI for system messages
        text: `You are now connected with ${peer.name}. Say hi!`,
        timestamp: new Date(),
        errors: []
      }
    ]);
    
    // Mock peer message after a delay
    setTimeout(() => {
      const peerMessage: TranscriptItem = {
        id: 'peer-1',
        speaker: 'peer',
        text: 'Hi there! Nice to meet you. How are you doing today?',
        timestamp: new Date(),
        errors: []
      };
      
      setMessages(prevMessages => [...prevMessages, peerMessage]);
    }, 2000);
  }, []);
  
  const handleSendMessage = () => {
    if (message.trim() === '') return;
    
    const newUserMessage: TranscriptItem = {
      id: Date.now().toString(),
      speaker: 'user',
      text: message,
      timestamp: new Date(),
      errors: []
    };
    
    setMessages([...messages, newUserMessage]);
    setMessage('');
    
    // Mock peer response after a delay
    setTimeout(() => {
      const peerResponse: TranscriptItem = {
        id: (Date.now() + 1).toString(),
        speaker: 'peer',
        text: 'That\'s interesting! I\'m learning English to travel abroad next year. What about you?',
        timestamp: new Date(),
        errors: []
      };
      
      setMessages(prevMessages => [...prevMessages, peerResponse]);
      
      // Scroll to bottom
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 2000);
  };
  
  const handleCallRequest = () => {
    setIsCallRequested(true);
    
    // Show incoming call UI
    // In a real app, this would send a call request to the peer
  };
  
  const handleAcceptCall = () => {
    setIsCallRequested(false);
    router.push({
      pathname: '/peer-call',
      params: { peerId: peer.id }
    });
  };
  
  const handleDeclineCall = () => {
    setIsCallRequested(false);
  };
  
  const handleEndSession = () => {
    // Show confirmation modal
    router.push({
      pathname: '/session-end-confirmation',
      params: { type: 'peer-chat' }
    });
  };
  
  const renderMessageItem = ({ item }: { item: TranscriptItem }) => (
    <View style={[
      styles.messageContainer,
      item.speaker === 'user' ? styles.userMessage : 
      item.speaker === 'peer' ? styles.peerMessage : styles.systemMessage
    ]}>
      {item.speaker !== 'user' && (
        <Image
          source={{ uri: item.speaker === 'peer' ? peer.avatar : undefined }}
          style={styles.avatar}
        />
      )}
      <View style={[
        styles.messageBubble,
        item.speaker === 'user' ? styles.userBubble : 
        item.speaker === 'peer' ? styles.peerBubble : styles.systemBubble
      ]}>
        <ThemedText>{item.text}</ThemedText>
        <ThemedText style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
    </View>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: peer.name,
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
        {isCallRequested && (
          <View style={styles.callRequestBanner}>
            <ThemedText style={styles.callRequestText}>
              {peer.name} is calling you
            </ThemedText>
            <View style={styles.callActions}>
              <TouchableOpacity 
                style={[styles.callActionButton, styles.declineButton]}
                onPress={handleDeclineCall}>
                <IconSymbol size={20} name="phone.down.fill" color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.callActionButton, styles.acceptButton]}
                onPress={handleAcceptCall}>
                <IconSymbol size={20} name="phone.fill" color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
  callRequestBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECF3FF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  callRequestText: {
    fontWeight: '500',
  },
  callActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  acceptButton: {
    backgroundColor: '#4CD964',
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
  systemMessage: {
    alignSelf: 'center',
    maxWidth: '90%',
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
  systemBubble: {
    backgroundColor: '#E5E5E5',
    borderRadius: 8,
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
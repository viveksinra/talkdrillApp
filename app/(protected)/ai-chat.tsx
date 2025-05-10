import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AIModel, Topic, TranscriptItem } from '@/types';

export default function AIChatScreen() {
  const router = useRouter();
  const { modelId, topicId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<TranscriptItem[]>([]);
  const [model, setModel] = useState<AIModel | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  
  // Mock fetch model and topic data
  useEffect(() => {
    // In a real app, fetch from API
    setModel({
      id: '1',
      name: 'Teacher Emma',
      role: 'Language Teacher',
      avatar: 'https://via.placeholder.com/100',
      description: 'Patient and encouraging English teacher with 5+ years of experience.'
    });
    
    setTopic({
      id: '1',
      title: 'Airport Journey',
      description: 'Practice conversations about navigating airports and travel.',
      suitableFor: ['beginner', 'intermediate']
    });
    
    // Add initial AI message
    setMessages([
      {
        id: '1',
        speaker: 'ai',
        text: 'Hello! I\'m Teacher Emma. Today we\'ll practice a conversation about navigating an airport. Let\'s start! Can you tell me about your upcoming travel plans?',
        timestamp: new Date(),
        errors: []
      }
    ]);
  }, [modelId, topicId]);
  
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
    
    // Mock AI response after a delay
    setTimeout(() => {
      const aiResponse: TranscriptItem = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai',
        text: 'That sounds interesting! Where will you be flying to? Is this your first time traveling there?',
        timestamp: new Date(),
        errors: []
      };
      
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      
      // Scroll to bottom
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 1000);
  };
  
  const handleEndSession = () => {
    // Show confirmation modal
    router.push({
      pathname: '/session-end-confirmation',
      params: { type: 'ai-chat' }
    });
  };
  
  const renderMessageItem = ({ item }: { item: TranscriptItem }) => (
    <View style={[
      styles.messageContainer,
      item.speaker === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      {item.speaker === 'ai' && (
        <Image
          source={{ uri: model?.avatar }}
          style={styles.avatar}
        />
      )}
      <View style={[
        styles.messageBubble,
        item.speaker === 'user' ? styles.userBubble : styles.aiBubble
      ]}>
        <ThemedText>{item.text}</ThemedText>
        <ThemedText style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
    </View>
  );
  
  if (!model || !topic) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading conversation...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: model.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleEndSession}>
              <IconSymbol size={24} name="phone.down.fill" color="#FF3B30" />
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  aiMessage: {
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
  aiBubble: {
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
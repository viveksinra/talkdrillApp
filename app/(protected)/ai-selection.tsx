import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AIModel, Topic } from '@/types';

export default function AISelectionScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Mock data for AI models
  const models: AIModel[] = [
    {
      id: '1',
      name: 'Teacher Emma',
      role: 'Language Teacher',
      avatar: 'https://via.placeholder.com/100',
      description: 'Patient and encouraging English teacher with 5+ years of experience.'
    },
    {
      id: '2',
      name: 'Engineer John',
      role: 'Software Engineer',
      avatar: 'https://via.placeholder.com/100',
      description: 'Specializes in technical discussions and job interview preparation.'
    },
    {
      id: '3',
      name: 'Counselor Sarah',
      role: 'Career Counselor',
      avatar: 'https://via.placeholder.com/100',
      description: 'Helps with professional conversations and career advancement discussions.'
    }
  ];
  
  // Mock data for topics
  const topics: Topic[] = [
    {
      id: '1',
      title: 'Airport Journey',
      description: 'Practice conversations about navigating airports and travel.',
      suitableFor: ['beginner', 'intermediate']
    },
    {
      id: '2',
      title: 'Job Interview',
      description: 'Practice common job interview questions and responses.',
      suitableFor: ['intermediate', 'advanced']
    },
    {
      id: '3',
      title: 'Restaurant Ordering',
      description: 'Practice ordering food and making reservations.',
      suitableFor: ['beginner']
    },
    {
      id: '4',
      title: 'Business Meeting',
      description: 'Practice formal business discussions and presentations.',
      suitableFor: ['advanced']
    }
  ];
  
  const handleStartSession = () => {
    if (selectedModel && selectedTopic) {
      if (mode === 'chat') {
        router.push({
          pathname: '/ai-chat',
          params: { modelId: selectedModel, topicId: selectedTopic }
        });
      } else {
        router.push({
          pathname: '/ai-call',
          params: { modelId: selectedModel, topicId: selectedTopic }
        });
      }
    }
  };
  
  const renderModelItem = ({ item }: { item: AIModel }) => (
    <TouchableOpacity 
      style={[
        styles.modelCard,
        selectedModel === item.id && styles.selectedModelCard
      ]}
      onPress={() => setSelectedModel(item.id)}>
      <Image 
        source={{ uri: item.avatar }}
        style={styles.modelAvatar}
      />
      <View style={styles.modelInfo}>
        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
        <ThemedText>{item.role}</ThemedText>
      </View>
    </TouchableOpacity>
  );
  
  const renderTopicItem = ({ item }: { item: Topic }) => (
    <TouchableOpacity 
      style={[
        styles.topicCard,
        selectedTopic === item.id && styles.selectedTopicCard
      ]}
      onPress={() => setSelectedTopic(item.id)}>
      <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
      <ThemedText>{item.description}</ThemedText>
      <View style={styles.levelContainer}>
        {item.suitableFor.map(level => (
          <View key={level} style={styles.levelBadge}>
            <ThemedText style={styles.levelText}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </ThemedText>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: mode === 'chat' ? 'Chat with AI' : 'Call with AI',
        }}
      />
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Choose an AI Assistant</ThemedText>
        <FlatList
          data={models}
          renderItem={renderModelItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modelsList}
        />
        
        <ThemedText type="subtitle">Choose a Topic</ThemedText>
        <FlatList
          data={topics}
          renderItem={renderTopicItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.topicsList}
        />
        
        <TouchableOpacity
          style={[
            styles.startButton,
            (!selectedModel || !selectedTopic) && styles.startButtonDisabled
          ]}
          disabled={!selectedModel || !selectedTopic}
          onPress={handleStartSession}>
          <ThemedText style={styles.startButtonText}>
            Start {mode === 'chat' ? 'Chat' : 'Call'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  modelsList: {
    paddingVertical: 16,
    gap: 12,
  },
  modelCard: {
    width: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  selectedModelCard: {
    backgroundColor: '#ECF3FF',
    borderWidth: 2,
    borderColor: '#4A86E8',
  },
  modelAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  modelInfo: {
    alignItems: 'center',
  },
  topicsList: {
    paddingVertical: 16,
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedTopicCard: {
    backgroundColor: '#ECF3FF',
    borderWidth: 2,
    borderColor: '#4A86E8',
  },
  levelContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  levelBadge: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
  },
  startButton: {
    backgroundColor: '#4A86E8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#A8C1E5',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 
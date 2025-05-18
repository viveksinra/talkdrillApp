import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { fetchAICharacterDetails, startConversation } from '../../../api/services/public/aiCharacters';

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  gender: string;
  age: number;
  languages: string[];
  expertiseLevel: string;
  background: string;
  teachingStyle: string;
  personality: string;
  profileImage: string;
  tags: string[];
}

export default function AICharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [character, setCharacter] = useState<AICharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingCall, setStartingCall] = useState(false);
  
  useEffect(() => {
    if (!id) {
      setError('Character ID is required');
      setLoading(false);
      return;
    }
    
    loadCharacterDetails();
  }, [id]);
  
  const loadCharacterDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchAICharacterDetails(id as string);
      setCharacter(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load character details. Please try again later.');
      setLoading(false);
      console.error('Error loading character details:', err);
    }
  };
  
  const handleStartConversation = async (callType: 'chat' | 'audio' | 'video') => {
    if (!character) return;
    
    try {
      setStartingCall(true);
      const conversation = await startConversation(character._id, callType);
      
      // Navigate to appropriate screen based on call type
        router.push({
          pathname: '/(protected)/ai-video/[id]',
          params: { id: conversation._id }
        });
      
      
      setStartingCall(false);
    } catch (err) {
      setStartingCall(false);
      Alert.alert('Error', 'Failed to start conversation. Please try again later.');
      console.error('Error starting conversation:', err);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading tutor details...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !character) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error || 'Character not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCharacterDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: character.profileImage || 'https://via.placeholder.com/150' }}
            style={styles.profileImage}
          />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{character.name}</Text>
            <Text style={styles.profession}>{character.profession}</Text>
            <Text style={styles.subtitle}>{character.nationality} • {character.age} years old</Text>
          </View>
        </View>
        
        <View style={styles.tagsContainer}>
          {character.languages.map((language, index) => (
            <View key={`lang-${index}`} style={styles.tag}>
              <Text style={styles.tagText}>{language}</Text>
            </View>
          ))}
          
          {character.tags.map((tag, index) => (
            <View key={`tag-${index}`} style={[styles.tag, styles.secondaryTag]}>
              <Text style={styles.secondaryTagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background</Text>
          <Text style={styles.sectionText}>{character.background}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teaching Style</Text>
          <Text style={styles.sectionText}>{character.teachingStyle}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personality</Text>
          <Text style={styles.sectionText}>{character.personality}</Text>
        </View>
        
        <View style={styles.callToActionContainer}>
          <Text style={styles.callToActionTitle}>Start a conversation</Text>
          <Text style={styles.callToActionSubtitle}>
            Choose how you want to practice your language skills
          </Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => handleStartConversation('chat')}
              disabled={startingCall}
            >
              <Ionicons name="chatbubble-outline" size={24} color="white" />
              <Text style={styles.buttonText}>Text Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.audioButton]}
              onPress={() => handleStartConversation('audio')}
              disabled={startingCall}
            >
              <Ionicons name="mic-outline" size={24} color="white" />
              <Text style={styles.buttonText}>Audio Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.videoButton]}
              onPress={() => handleStartConversation('video')}
              disabled={startingCall}
            >
              <Ionicons name="videocam-outline" size={24} color="white" />
              <Text style={styles.buttonText}>Video Call</Text>
            </TouchableOpacity>
          </View>
          
          {startingCall && (
            <ActivityIndicator 
              style={styles.callLoader} 
              size="small" 
              color={Colors.primary} 
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  nameContainer: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  profession: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryTag: {
    backgroundColor: Colors.lightAccent,
  },
  secondaryTagText: {
    color: Colors.darkAccent,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  callToActionContainer: {
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  callToActionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  callToActionSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  chatButton: {
    backgroundColor: Colors.primary,
  },
  audioButton: {
    backgroundColor: Colors.secondary,
  },
  videoButton: {
    backgroundColor: Colors.accent,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  callLoader: {
    marginTop: 16,
  },
}); 
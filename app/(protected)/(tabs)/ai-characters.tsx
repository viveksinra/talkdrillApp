import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchAICharacters } from '@/api/services/public/aiCharacters';
import { Colors } from '@/constants/Colors';

interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  nationality: string;
  profileImage: string;
  tags: string[];
  languages: string[];
}

export default function AICharactersScreen() {
  const router = useRouter();
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  const loadCharacters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchAICharacters();
      setCharacters(data);
      
      // Extract all unique tags
      const tags = data.reduce((acc: string[], char) => {
        char.tags.forEach(tag => {
          if (!acc.includes(tag)) {
            acc.push(tag);
          }
        });
        return acc;
      }, []);
      
      setAllTags(tags);
      setLoading(false);
    } catch (err) {
      setError('Failed to load AI tutors. Please try again.');
      setLoading(false);
      console.error('Error loading AI characters:', err);
    }
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCharacters();
    setRefreshing(false);
  }, [loadCharacters]);
  
  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);
  
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const filteredCharacters = selectedTags.length > 0
    ? characters.filter(char => 
        selectedTags.some(tag => char.tags.includes(tag))
      )
    : characters;
  
  const renderCharacterItem = ({ item }: { item: AICharacter }) => (
    <TouchableOpacity
      style={styles.characterCard}
      onPress={() => router.push(`/(protected)/ai-character/${item._id}`)}
    >
      <View style={styles.cardContentContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.characterName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFC107" />
            <Text style={styles.ratingText}>4.7</Text>
          </View>
        </View>
        
        <Text style={styles.characterProfession}>{item.profession}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.sessionsContainer}>
            <Ionicons name="time-outline" size={16} color={Colors.light.primary} />
            <Text style={styles.sessionsText}>189 sessions</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.startSessionButton} onPress={() => router.push(`/(protected)/ai-character/${item._id}`)}>
          <Text style={styles.startSessionText}>View Details</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.profileImage || 'https://via.placeholder.com/150' }}
          style={styles.characterImage}
        />
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Advanced</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Tutors</Text>
      </View>
      
      {allTags.length > 0 && (
        <View style={styles.tagsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={allTags}
            keyExtractor={(item) => `tag-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.tagButton,
                  selectedTags.includes(item) ? styles.tagButtonSelected : null
                ]}
                onPress={() => toggleTag(item)}
              >
                <Text 
                  style={[
                    styles.tagButtonText,
                    selectedTags.includes(item) ? styles.tagButtonTextSelected : null
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tagsList}
          />
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading tutors...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="red" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCharacters}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCharacters}
          keyExtractor={(item) => item._id}
          renderItem={renderCharacterItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.light.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color={Colors.light.surface} />
              <Text style={styles.emptyText}>No tutors found</Text>
              {selectedTags.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearFiltersButton}
                  onPress={() => setSelectedTags([])}
                >
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  tagsContainer: {
    backgroundColor: Colors.light.background,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
  },
  tagsList: {
    paddingHorizontal: 16,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    marginRight: 8,
  },
  tagButtonSelected: {
    backgroundColor: Colors.light.primary,
  },
  tagButtonText: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  tagButtonTextSelected: {
    color: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.light.secondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: Colors.light.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  characterCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardContentContainer: {
    flex: 1,
    marginRight: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  characterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  characterProfession: {
    fontSize: 16,
    color: Colors.light.secondary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sessionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sessionsText: {
    color: Colors.light.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  startSessionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startSessionText: {
    color: Colors.light.background,
    fontWeight: '600',
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  characterImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    backgroundColor: '#FF4C4C',
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondary,
    marginTop: 12,
    marginBottom: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 5,
  },
  clearFiltersText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
}); 
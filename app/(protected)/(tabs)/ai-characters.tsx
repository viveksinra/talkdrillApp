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
import { fetchAICharacters } from '../../../api/services/public/aiCharacters';
import Colors from '../../../constants/Colors';

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
      <Image 
        source={{ uri: item.profileImage || 'https://via.placeholder.com/150' }}
        style={styles.characterImage}
      />
      <View style={styles.characterInfo}>
        <Text style={styles.characterName}>{item.name}</Text>
        <Text style={styles.characterProfession}>{item.profession}</Text>
        <Text style={styles.characterNationality}>{item.nationality}</Text>
        
        <View style={styles.languagesContainer}>
          {item.languages.slice(0, 3).map((language, index) => (
            <View key={`${item._id}-lang-${index}`} style={styles.languageTag}>
              <Text style={styles.languageText}>{language}</Text>
            </View>
          ))}
          {item.languages.length > 3 && (
            <Text style={styles.moreLanguages}>+{item.languages.length - 3}</Text>
          )}
        </View>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={24} 
        color={Colors.textSecondary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Language Tutors</Text>
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
          <ActivityIndicator size="large" color={Colors.primary} />
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
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color={Colors.textTertiary} />
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  tagsContainer: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tagsList: {
    paddingHorizontal: 16,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  tagButtonSelected: {
    backgroundColor: Colors.primary,
  },
  tagButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tagButtonTextSelected: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
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
  list: {
    padding: 16,
  },
  characterCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  characterImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  characterInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  characterProfession: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  characterNationality: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  languageText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  moreLanguages: {
    fontSize: s2,
    color: Colors.textTertiary,
  },
  chevron: {
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { fetchProfessionals, Professional } from '@/api/services/public/professionalService';
import { ProfessionalCard } from '@/components/shared/ProfessionalCard';
import { Colors } from '@/constants/Colors';

export default function ProfessionalsScreen() {
  const router = useRouter();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [allSpecializations] = useState<string[]>([
    'business_english',
    'conversation',
    'interview_preparation',
    'ielts_preparation',
    'academic_english',
    'pronunciation',
  ]);

  const loadProfessionals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: 1,
        limit: 20,
        sortBy: 'averageRating',
        sortOrder: 'desc' as const,
        ...(selectedSpecializations.length > 0 && {
          specialization: selectedSpecializations[0]
        })
      };

      const data = await fetchProfessionals(params);
      setProfessionals(data.professionals);
      setLoading(false);
    } catch (err) {
      setError('Failed to load professionals. Please try again.');
      setLoading(false);
      console.error('Error loading professionals:', err);
    }
  }, [selectedSpecializations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfessionals();
    setRefreshing(false);
  }, [loadProfessionals]);

  useEffect(() => {
    loadProfessionals();
  }, [loadProfessionals]);

  const toggleSpecialization = (specialization: string) => {
    if (selectedSpecializations.includes(specialization)) {
      setSelectedSpecializations(selectedSpecializations.filter(s => s !== specialization));
    } else {
      setSelectedSpecializations([specialization]); // Only one at a time for simplicity
    }
  };

  const formatSpecializationText = (spec: string) => {
    return spec.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderProfessionalItem = ({ item }: { item: Professional }) => (
    <ProfessionalCard
      professional={item}
      onPress={() => router.push(`/(protected)/professional-profile/${item._id}`)}
    />
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Talk with Professionals',
        }}
      />

      {/* Specialization Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={allSpecializations}
          keyExtractor={(item) => `filter-${item}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedSpecializations.includes(item) ? styles.filterButtonSelected : null
              ]}
              onPress={() => toggleSpecialization(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedSpecializations.includes(item) ? styles.filterButtonTextSelected : null
                ]}
              >
                {formatSpecializationText(item)}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading professionals...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="red" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfessionals}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={professionals}
          keyExtractor={(item) => item._id}
          renderItem={renderProfessionalItem}
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
              <Ionicons name="people-outline" size={64} color={Colors.light.surface} />
              <Text style={styles.emptyText}>No professionals found</Text>
              {selectedSpecializations.length > 0 && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => setSelectedSpecializations([])}
                >
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
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
  filtersContainer: {
    backgroundColor: Colors.light.background,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    marginRight: 8,
  },
  filterButtonSelected: {
    backgroundColor: Colors.light.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  filterButtonTextSelected: {
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
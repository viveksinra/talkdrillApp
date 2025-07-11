import React, { useState, useMemo } from 'react';
import { 
  Modal, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';

export interface FilterOptions {
  gender: 'any' | 'male' | 'female';
  accent: 'indian' | 'american' | 'british' | 'australian';
  englishLevel: 'any' | 'beginner' | 'intermediate' | 'advanced';
}

interface FilterDialogProps {
  headerTitle: string;
  headerSubtitle: string;
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions, coinCost: number) => Promise<void>;
  initialFilters?: Partial<FilterOptions>;
  context?: 'peer-practice' | 'ai-call'; // Add context prop
}

export function FilterDialog({ 
  headerTitle,
  headerSubtitle,
  visible, 
  onClose, 
  onApply,
  initialFilters,
  context = 'ai-call' // Default to ai-call for backward compatibility
}: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    gender: initialFilters?.gender || 'any',
    accent: initialFilters?.accent || 'indian',
    englishLevel: initialFilters?.englishLevel || 'any',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate coin cost based on context and filters
  const coinCost = useMemo(() => {
    if (context === 'peer-practice') {
      // For peer practice: 5 coins if all filters are 'any', otherwise 10 coins
      const allFiltersAny = filters.gender === 'any' && filters.englishLevel === 'any';
      return allFiltersAny ? 5 : 10;
    }
    // For AI calls, return 0 (free) - maintain existing behavior
    return 0;
  }, [filters, context]);

  const handleApply = async () => {
    setIsProcessing(true);
    await onApply(filters, coinCost);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          <ScrollView>
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>{headerTitle}</ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <ThemedText style={styles.subtitle}>{headerSubtitle}</ThemedText>
            
            {/* gender */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {context === 'peer-practice' ? 'Partner Gender' : 'Assistant Gender'}
              </ThemedText>
              
              <View style={styles.options}>
                <TouchableOpacity 
                  style={[
                    styles.option, 
                    filters.gender === 'any' && styles.selectedOption
                  ]}
                  onPress={() => setFilters({...filters, gender: 'any'})}
                >
                  {filters.gender === 'any' && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                  )}
                  <ThemedText style={styles.optionText}>Any</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.option, 
                    filters.gender === 'male' && styles.selectedOption
                  ]}
                  onPress={() => setFilters({...filters, gender: 'male'})}
                >
                  <ThemedText style={styles.optionText}>Male</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.option, 
                    filters.gender === 'female' && styles.selectedOption
                  ]}
                  onPress={() => setFilters({...filters, gender: 'female'})}
                >
                  <ThemedText style={styles.optionText}>Female</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Only show accent for AI calls */}
            {context === 'ai-call' && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Accent</ThemedText>
                <View style={styles.options}>
                  <TouchableOpacity 
                    style={[
                      styles.option, 
                      filters.accent === 'indian' && styles.selectedOption
                    ]}
                    onPress={() => setFilters({...filters, accent: 'indian'})}
                  >
                    <ThemedText style={styles.optionText}>Indian</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.option, 
                      filters.accent === 'american' && styles.selectedOption
                    ]}
                    onPress={() => setFilters({...filters, accent: 'american'})}
                  >
                    <ThemedText style={styles.optionText}>American</ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={styles.options}>
                  <TouchableOpacity
                    style={[
                      styles.option, 
                      filters.accent === 'british' && styles.selectedOption
                    ]}
                    onPress={() => setFilters({...filters, accent: 'british'})}
                  >
                    <ThemedText style={styles.optionText}>British</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.option, 
                      filters.accent === 'australian' && styles.selectedOption
                    ]}
                    onPress={() => setFilters({...filters, accent: 'australian'})}
                  >
                    <ThemedText style={styles.optionText}>Australian</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* language level */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>English Level</ThemedText>
              
              <View style={styles.options}>
                <TouchableOpacity 
                  style={[
                    styles.option, 
                    filters.englishLevel === 'any' && styles.selectedOption
                  ]}
                  onPress={() => setFilters({...filters, englishLevel: 'any'})}
                >
                  {filters.englishLevel === 'any' && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                  )}
                  <ThemedText style={styles.optionText}>Any</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.option, 
                    filters.englishLevel === 'beginner' && styles.selectedOption
                  ]}
                  onPress={() => setFilters({...filters, englishLevel: 'beginner'})}
                >
                  <ThemedText style={styles.optionText}>Beginner</ThemedText>
                </TouchableOpacity>
              </View>
              
              <View style={styles.options}>
                <TouchableOpacity 
                  style={[
                    styles.option, 
                    filters.englishLevel === 'intermediate' && styles.selectedOption
                  ]}
                  onPress={() => setFilters({...filters, englishLevel: 'intermediate'})}
                >
                  <ThemedText style={styles.optionText}>Intermediate</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.option, 
                    filters.englishLevel === 'advanced' && styles.selectedOption
                  ]}
                  onPress={() => setFilters({...filters, englishLevel: 'advanced'})}
                >
                  <ThemedText style={styles.optionText}>Advanced</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.costSection}>
              <View style={styles.costIcon}>
                <Ionicons name="wallet-outline" size={24} color="#FF9800" />
              </View>
              <View>
                <ThemedText style={styles.costLabel}>Cost per filter:</ThemedText>
                <ThemedText style={styles.costValue}>
                  {context === 'peer-practice' 
                    ? `${coinCost} coins per 5 minutes`
                    : context === 'ai-call' ? '1 coin per minute' : 'Free for all filters'
                  }
                </ThemedText>
              </View>
            </View>
            
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
              <ThemedText style={styles.applyButtonText}>
                Apply Filters
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 8, marginTop: 8}} />
              </ThemedText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '95%',
    height: 'auto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 5,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 18,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  option: {
    flex: 1,
    height: 56,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    position: 'relative',
  },
  selectedOption: {
    backgroundColor: '#5933F9',
    color:'#fafafa'
  },
  optionText: {
    color: '#333',
    fontWeight: '500',
  },
  costSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
  },
  costIcon: {
    marginRight: 12,
  },
  costLabel: {
    fontWeight: '600',
  },
  costValue: {
    color: '#FF9800',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#5933F9',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1,
  },
});

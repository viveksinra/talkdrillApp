import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Pressable,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';

export interface FilterOptions {
  gender: 'any' | 'male' | 'female';
  englishLevel: 'any' | 'beginner' | 'intermediate' | 'advanced';
}

interface FilterDialogProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
}

export function FilterDialog({ 
  visible, 
  onClose, 
  onApply,
  initialFilters 
}: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    gender: initialFilters?.gender || 'any',
    englishLevel: initialFilters?.englishLevel || 'any',
  });

  const handleApply = () => {
    onApply(filters);
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
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>Filter Settings</ThemedText>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>
          
          <ThemedText style={styles.subtitle}>Customize your conversation partner</ThemedText>
          
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Assistant Gender</ThemedText>
            
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
                Free for all filters
              </ThemedText>
            </View>
          </View>
          
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <ThemedText style={styles.applyButtonText}>
              Apply Filters
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 8, marginTop: 8}} />
            </ThemedText>
          </TouchableOpacity>
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
    maxHeight: '80%',
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
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
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

import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PeerFilters } from '@/types';

export default function PeerFilterScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  
  const [filters, setFilters] = useState<PeerFilters>({
    proficiencyLevel: 'intermediate',
    gender: 'any',
    isCertifiedTeacher: false,
    randomMatch: true
  });
  
  const [coinBalance, setCoinBalance] = useState(100);
  
  const handleLevelChange = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setFilters({ ...filters, proficiencyLevel: level });
  };
  
  const handleGenderChange = (gender: 'male' | 'female' | 'any') => {
    setFilters({ ...filters, gender });
  };
  
  const handleTeacherToggle = () => {
    setFilters({ ...filters, isCertifiedTeacher: !filters.isCertifiedTeacher });
  };
  
  const handleRandomMatchToggle = () => {
    setFilters({ ...filters, randomMatch: !filters.randomMatch });
  };
  
  const handleFindPartner = () => {
    if (filters.gender !== 'any' || filters.isCertifiedTeacher) {
      if (coinBalance < 20) {
        // Show not enough coins alert
        return;
      }
      
      // Deduct coins for premium filters
      setCoinBalance(coinBalance - 20);
    }
    
    // Mock finding a partner
    router.push({
      pathname: mode === 'chat' ? '/peer-chat' : '/peer-call',
      params: { 
        level: filters.proficiencyLevel,
        gender: filters.gender,
        teacher: filters.isCertifiedTeacher ? '1' : '0',
        random: filters.randomMatch ? '1' : '0'
      }
    });
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: mode === 'chat' ? 'Find Chat Partner' : 'Find Call Partner',
        }}
      />
      <ThemedView style={styles.container}>
        <View style={styles.coinBalanceBar}>
          <ThemedText>Your Balance:</ThemedText>
          <View style={styles.coinDisplay}>
            <IconSymbol size={16} name="bitcoinsign.circle.fill" color="#F5A623" />
            <ThemedText>{coinBalance} coins</ThemedText>
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <ThemedText type="defaultSemiBold">Proficiency Level (Free)</ThemedText>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.proficiencyLevel === 'beginner' && styles.selectedOption
              ]}
              onPress={() => handleLevelChange('beginner')}>
              <ThemedText
                style={filters.proficiencyLevel === 'beginner' ? styles.selectedOptionText : {}}>
                Beginner
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.proficiencyLevel === 'intermediate' && styles.selectedOption
              ]}
              onPress={() => handleLevelChange('intermediate')}>
              <ThemedText
                style={filters.proficiencyLevel === 'intermediate' ? styles.selectedOptionText : {}}>
                Intermediate
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.proficiencyLevel === 'advanced' && styles.selectedOption
              ]}
              onPress={() => handleLevelChange('advanced')}>
              <ThemedText
                style={filters.proficiencyLevel === 'advanced' ? styles.selectedOptionText : {}}>
                Advanced
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <View style={styles.premiumFilterHeader}>
            <ThemedText type="defaultSemiBold">Gender Preference (Premium)</ThemedText>
            <View style={styles.coinBadge}>
              <IconSymbol size={12} name="bitcoinsign.circle.fill" color="#F5A623" />
              <ThemedText style={styles.coinBadgeText}>10 coins</ThemedText>
            </View>
          </View>
          
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.gender === 'male' && styles.selectedOption
              ]}
              onPress={() => handleGenderChange('male')}>
              <ThemedText
                style={filters.gender === 'male' ? styles.selectedOptionText : {}}>
                Male
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.gender === 'female' && styles.selectedOption
              ]}
              onPress={() => handleGenderChange('female')}>
              <ThemedText
                style={filters.gender === 'female' ? styles.selectedOptionText : {}}>
                Female
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.gender === 'any' && styles.selectedOption
              ]}
              onPress={() => handleGenderChange('any')}>
              <ThemedText
                style={filters.gender === 'any' ? styles.selectedOptionText : {}}>
                Any
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <View style={styles.premiumFilterHeader}>
            <ThemedText type="defaultSemiBold">Certified Teacher (Premium)</ThemedText>
            <View style={styles.coinBadge}>
              <IconSymbol size={12} name="bitcoinsign.circle.fill" color="#F5A623" />
              <ThemedText style={styles.coinBadgeText}>20 coins</ThemedText>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.toggleOption, filters.isCertifiedTeacher && styles.toggleOptionActive]}
            onPress={handleTeacherToggle}>
            <ThemedText>Practice with a certified language teacher</ThemedText>
            <View style={[
              styles.toggleSwitch,
              filters.isCertifiedTeacher && styles.toggleSwitchActive
            ]}>
              <View style={[
                styles.toggleButton,
                filters.isCertifiedTeacher && styles.toggleButtonActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterSection}>
          <ThemedText type="defaultSemiBold">Match Type (Free)</ThemedText>
          <TouchableOpacity
            style={[styles.toggleOption, filters.randomMatch && styles.toggleOptionActive]}
            onPress={handleRandomMatchToggle}>
            <ThemedText>Random matching (faster)</ThemedText>
            <View style={[
              styles.toggleSwitch,
              filters.randomMatch && styles.toggleSwitchActive
            ]}>
              <View style={[
                styles.toggleButton,
                filters.randomMatch && styles.toggleButtonActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.findButton}
          onPress={handleFindPartner}>
          <ThemedText style={styles.findButtonText}>Find Partner</ThemedText>
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
  coinBalanceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterSection: {
    marginBottom: 24,
  },
  premiumFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  coinBadgeText: {
    fontSize: 12,
    color: '#F5A623',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4A86E8',
  },
  selectedOptionText: {
    color: 'white',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  toggleOptionActive: {
    backgroundColor: '#ECF3FF',
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5E5',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#4A86E8',
  },
  toggleButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
  },
  toggleButtonActive: {
    transform: [{ translateX: 20 }],
  },
  findButton: {
    backgroundColor: '#4A86E8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  findButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
}); 
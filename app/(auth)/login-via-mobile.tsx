import { StyleSheet, TouchableOpacity, View, TextInput, Linking, Modal, FlatList, SafeAreaView } from 'react-native';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

// Array of country codes with their respective flags and dial codes
const countryCodes = [
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dial_code: '+81', flag: '🇯🇵' },
  { code: 'DE', name: 'Germany', dial_code: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial_code: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dial_code: '+39', flag: '🇮🇹' },
  { code: 'BR', name: 'Brazil', dial_code: '+55', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', dial_code: '+1', flag: '🇨🇦' },
  { code: 'RU', name: 'Russia', dial_code: '+7', flag: '🇷🇺' },
  { code: 'KR', name: 'South Korea', dial_code: '+82', flag: '🇰🇷' },
  { code: 'ES', name: 'Spain', dial_code: '+34', flag: '🇪🇸' },
  { code: 'MX', name: 'Mexico', dial_code: '+52', flag: '🇲🇽' },
  { code: 'ID', name: 'Indonesia', dial_code: '+62', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', dial_code: '+63', flag: '🇵🇭' },
  { code: 'SG', name: 'Singapore', dial_code: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dial_code: '+60', flag: '🇲🇾' },
  { code: 'NZ', name: 'New Zealand', dial_code: '+64', flag: '🇳🇿' },
  { code: 'TH', name: 'Thailand', dial_code: '+66', flag: '🇹🇭' },
  { code: 'AE', name: 'United Arab Emirates', dial_code: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial_code: '+966', flag: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', dial_code: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial_code: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', dial_code: '+20', flag: '🇪🇬' },
  { code: 'PK', name: 'Pakistan', dial_code: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial_code: '+880', flag: '🇧🇩' },
  { code: 'TR', name: 'Turkey', dial_code: '+90', flag: '🇹🇷' },
  { code: 'VN', name: 'Vietnam', dial_code: '+84', flag: '🇻🇳' },
  // Add more countries as needed
];

export default function LoginViaMobileScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [countryFlag, setCountryFlag] = useState('🇮🇳');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCountries = searchQuery 
    ? countryCodes.filter(country => 
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        country.dial_code.includes(searchQuery) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : countryCodes;
  
  // Phone number validation
  const isValidPhoneNumber = () => {
    const cleanedNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    return cleanedNumber.length === 10;
  };
  
  const handlePhoneNumberChange = (text: string) => {
    // Only allow digits and limit to 10 characters
    const cleanedText = text.replace(/\D/g, '');
    if (cleanedText.length <= 10) {
      setPhoneNumber(cleanedText);
    }
  };
  
  const handleContinue = () => {
    if (isValidPhoneNumber()) {
      router.push({
        pathname: '/otp-verification',
        params: { phoneNumber: countryCode + phoneNumber }
      });
    }
  };

  const handleBack = () => {
    router.back();
  };
  
  const selectCountry = (country:any) => {
    setCountryCode(country.dial_code);
    setCountryFlag(country.flag);
    setModalVisible(false);
  };
  
  return (
    <ThemedView style={styles.container}>
      
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Enter your mobile number</ThemedText>
        <ThemedText style={styles.subtitle}>We'll send you a 4-digit code to verify your number</ThemedText>
        
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.countryCodeContainer}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.codeWithFlag}>
              <ThemedText style={styles.flag}>{countryFlag}</ThemedText>
              <ThemedText style={styles.countryCode}>{countryCode}</ThemedText>
            </View>
            <IconSymbol name="chevron.down" size={20} color="#666" />
          </TouchableOpacity>
          
          <TextInput
            style={[
              styles.input,
              phoneNumber.length > 0 && !isValidPhoneNumber() && styles.inputError
            ]}
            placeholder="Mobile number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            maxLength={10}
          />
        </View>
        
        {/* Validation message */}
        {phoneNumber.length > 0 && !isValidPhoneNumber() && (
          <ThemedText style={styles.errorText}>
            Please enter a valid 10-digit mobile number
          </ThemedText>
        )}
        
        <TouchableOpacity 
          style={[
            styles.continueButton,
            !isValidPhoneNumber() && styles.disabledButton
          ]}
          disabled={!isValidPhoneNumber()}
          onPress={handleContinue}>
          <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <IconSymbol name="info.circle.fill" size={24} color="#5D5FEF" />
        <ThemedText style={styles.infoText}>
          Your number will only be used for verification and won't be shared with others.
        </ThemedText>
      </View>
      
      {/* Country Code Selection Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <IconSymbol name="xmark" size={24} color="#333" />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
            <View style={{width: 24}} />
          </View>
          
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by country name or code"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.countryItem}
                onPress={() => selectCountry(item)}
              >
                <ThemedText style={styles.countryFlag}>{item.flag}</ThemedText>
                <View style={styles.countryInfo}>
                  <ThemedText style={styles.countryName}>{item.name}</ThemedText>
                  <ThemedText style={styles.countryDialCode}>{item.dial_code}</ThemedText>
                </View>
              </TouchableOpacity>
            )}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
          />
        </SafeAreaView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backText: {
    fontSize: 18,
    color: '#5D5FEF',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    width: 90,
    justifyContent: 'space-between',
  },
  codeWithFlag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#5D5FEF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#C4C4C4',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 'auto',
    marginBottom: 40,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#333',
    fontSize: 16,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  countryDialCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inputError: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 104, // Align with input field (90px + 12px margin + 2px adjustment)
  },
}); 
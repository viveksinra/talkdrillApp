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
  const [referralCode, setReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  
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
    const regex = /^\d{6,14}$/; // only digits, length 6 to 14
    return regex.test(cleanedNumber);
  };
  
  const handlePhoneNumberChange = (text: string) => {
    // Only allow digits
    const cleanedText = text.replace(/\D/g, '');
    setPhoneNumber(cleanedText);
  };
  
  const handleContinue = () => {
    if (isValidPhoneNumber()) {
      router.push({
        pathname: '/otp-verification',
        params: { 
          phoneNumber: countryCode + phoneNumber,
          referralCode: referralCode.trim() || undefined
        }
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
              (phoneNumber.length <6 || phoneNumber.length > 14) 
              && !isValidPhoneNumber() 
              && styles.inputError
            ]}
            placeholder="Mobile number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            maxLength={14}
          />
        </View>
        
        {/* Referral Code Section */}
        <TouchableOpacity 
          style={styles.referralToggle}
          onPress={() => setShowReferralInput(!showReferralInput)}
        >
          <ThemedText style={styles.referralToggleText}>
            Have a referral code? {showReferralInput ? '(Hide)' : '(Enter to get bonus coins)'}
          </ThemedText>
        </TouchableOpacity>
        
        {showReferralInput && (
          <View style={styles.referralContainer}>
            <TextInput
              style={styles.referralInput}
              placeholder="Enter referral code (e.g., VIV2NZ)"
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              autoCapitalize="characters"
            />
            <ThemedText style={styles.referralHint}>
              Get 150 bonus coins when you join with a valid referral code!
            </ThemedText>
          </View>
        )}
        
        {/* Validation message */}
        {phoneNumber.length > 0 && !isValidPhoneNumber() && (
          <ThemedText style={styles.errorText}>
            Please enter a mobile number between 6 and 14 digits
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
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
    gap: 12,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    minWidth: 100,
  },
  codeWithFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  referralToggle: {
    marginBottom: 16,
  },
  referralToggleText: {
    color: '#5D5FEF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  referralContainer: {
    width: '100%',
    marginBottom: 16,
  },
  referralInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  referralHint: {
    fontSize: 12,
    color: '#28A745',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#5D5FEF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 16,
  },
  countryFlag: {
    fontSize: 24,
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
    marginTop: 2,
  },
}); 
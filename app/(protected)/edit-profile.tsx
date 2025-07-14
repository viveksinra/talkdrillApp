import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Platform, ActivityIndicator, TextInput, Text as RNText, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Collapsible } from '@/components/Collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { uploadImage, updateUserProfile } from '@/api/services/private/userService';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  // Basic profile fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [languageProficiency, setLanguageProficiency] = useState(user?.languageProficiency || '');
  
  // Additional onboarding fields
  const [motherTongue, setMotherTongue] = useState(user?.motherTongue || '');
  const [learningMotivation, setLearningMotivation] = useState(user?.learningMotivation || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(user?.focusAreas || []);
  
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Options data from onboarding screen
  const motherTongueOptions = [
    { id: "arabic", label: "Arabic" },
    { id: "bengali", label: "Bengali" },
    { id: "chinese-mandarin", label: "Chinese (Mandarin)" },
    { id: "chinese-cantonese", label: "Chinese (Cantonese)" },
    { id: "english", label: "English" },
    { id: "french", label: "French" },
    { id: "german", label: "German" },
    { id: "hindi", label: "Hindi" },
    { id: "italian", label: "Italian" },
    { id: "japanese", label: "Japanese" },
    { id: "korean", label: "Korean" },
    { id: "portuguese", label: "Portuguese" },
    { id: "russian", label: "Russian" },
    { id: "spanish", label: "Spanish" },
    { id: "urdu", label: "Urdu" },
    { id: "other", label: "Other" },
  ];

  const motivationOptions = [
    { id: "career", label: "For Career Growth", icon: "💼" },
    { id: "academic", label: "For Academic Studies", icon: "🎓" },
    { id: "travel", label: "For Travel & Culture", icon: "✈️" },
  ];

  const interestOptions = [
    { id: "reading", label: "Reading", icon: "📚" },
    { id: "travel", label: "Travel", icon: "✈️" },
    { id: "music", label: "Music", icon: "🎵" },
    { id: "movies", label: "Movies", icon: "🎬" },
    { id: "sports", label: "Sports", icon: "⚽" },
    { id: "cooking", label: "Cooking", icon: "🍳" },
    { id: "technology", label: "Technology", icon: "💻" },
    { id: "art", label: "Art", icon: "🎨" },
  ];

  const focusAreaOptions = [
    { id: "grammar", label: "Grammar", icon: "📝" },
    { id: "vocabulary", label: "Vocabulary", icon: "📖" },
    { id: "listening", label: "Listening", icon: "🎧" },
    { id: "speaking", label: "Speaking", icon: "🎤" },
  ];

  // Handler functions for onboarding fields
  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const handleFocusAreaToggle = (areaId: string) => {
    setSelectedFocusAreas(prev => {
      if (prev.includes(areaId)) {
        return prev.filter(id => id !== areaId);
      } else {
        return [...prev, areaId];
      }
    });
  };

  // Email validation
  const validateEmail = (emailString: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailString && !emailRegex.test(emailString)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        setImageFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      setLoading(true);

      let imageUrl = user?.profileImage;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', {
          uri: imageFile.uri,
          type: 'image/jpeg',
          name: imageFile.fileName || 'profile-image.jpg',
        } as any);

        const uploadResponse = await uploadImage(formData);
        imageUrl = uploadResponse.imageUrl;
      }

      const userData = {
        name,
        email,
        profileImage: imageUrl,
        gender,
        languageProficiency,
        motherTongue,
        learningMotivation,
        interests: selectedInterests,
        focusAreas: selectedFocusAreas
      };

      await updateUserProfile(userData);

      updateUser({
        ...user,
        name,
        email,
        profileImage: imageUrl,
        gender,
        languageProficiency,
        motherTongue,
        learningMotivation,
        interests: selectedInterests,
        focusAreas: selectedFocusAreas
      });

      alert('Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
        }}
      />
      
      {/* Main content area with KeyboardAvoidingView and ScrollView */}
      <KeyboardAvoidingView 
        style={styles.contentWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.content}>
            <View style={styles.avatarContainer}>
              <Image
                source={imageFile ? { uri: imageFile.uri } : {uri: user?.profileImage}}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.editIconContainer} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.phoneInputContainer}>
                <RNText style={styles.label}>Phone(can't be changed)</RNText>
                <TextInput
                  placeholder="Enter your Phone Number"
                  readOnly
                  value={user?.phoneNumber}
                  autoCapitalize="none"
                  style={styles.phoneTextInput}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <RNText style={styles.label}>Name</RNText>
                <TextInput
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <RNText style={styles.label}>Email</RNText>
                <TextInput
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, emailError ? styles.inputError : null]}
                />
                {emailError ? <RNText style={styles.errorText}>{emailError}</RNText> : null}
              </View>

              {/* Gender Selection */}
              <View style={styles.inputGroup}>
                <RNText style={styles.label}>Gender</RNText>
                <View>
                  <TouchableOpacity
                    style={[styles.radioItem, gender === 'male' && styles.radioItemSelected]}
                    onPress={() => setGender('male')}
                  >
                    <View
                      style={[styles.radioButton, gender === 'male' && styles.radioButtonSelected]}
                    >
                      {gender === 'male' && <View style={styles.radioButtonInner} />}
                    </View>
                    <RNText style={styles.radioText}>Male</RNText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.radioItem, gender === 'female' && styles.radioItemSelected]}
                    onPress={() => setGender('female')}
                  >
                    <View
                      style={[styles.radioButton, gender === 'female' && styles.radioButtonSelected]}
                    >
                      {gender === 'female' && <View style={styles.radioButtonInner} />}
                    </View>
                    <RNText style={styles.radioText}>Female</RNText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.radioItem, gender === 'other' && styles.radioItemSelected]}
                    onPress={() => setGender('other')}
                  >
                    <View
                      style={[styles.radioButton, gender === 'other' && styles.radioButtonSelected]}
                    >
                      {gender === 'other' && <View style={styles.radioButtonInner} />}
                    </View>
                    <RNText style={styles.radioText}>Other</RNText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Language Proficiency Selection */}
              <View style={styles.inputGroup}>
                <RNText style={styles.label}>Language Proficiency</RNText>
                <View>
                  <TouchableOpacity
                    style={[styles.radioItem, languageProficiency === 'beginner' && styles.radioItemSelected]}
                    onPress={() => setLanguageProficiency('beginner')}
                  >
                    <View
                      style={[styles.radioButton, languageProficiency === 'beginner' && styles.radioButtonSelected]}
                    >
                      {languageProficiency === 'beginner' && <View style={styles.radioButtonInner} />}
                    </View>
                    <RNText style={styles.radioText}>Beginner</RNText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.radioItem, languageProficiency === 'intermediate' && styles.radioItemSelected]}
                    onPress={() => setLanguageProficiency('intermediate')}
                  >
                    <View
                      style={[styles.radioButton, languageProficiency === 'intermediate' && styles.radioButtonSelected]}
                    >
                      {languageProficiency === 'intermediate' && <View style={styles.radioButtonInner} />}
                    </View>
                    <RNText style={styles.radioText}>Intermediate</RNText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.radioItem, languageProficiency === 'advanced' && styles.radioItemSelected]}
                    onPress={() => setLanguageProficiency('advanced')}
                  >
                    <View
                      style={[styles.radioButton, languageProficiency === 'advanced' && styles.radioButtonSelected]}
                    >
                      {languageProficiency === 'advanced' && <View style={styles.radioButtonInner} />}
                    </View>
                    <RNText style={styles.radioText}>Advanced</RNText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Additional Details Section */}
              <View style={styles.additionalDetailsSection}>
                <ThemedText style={styles.sectionTitle}>Additional Details</ThemedText>
                
                {/* Mother Tongue Collapsible */}
                <View style={styles.collapsibleContainer}>
                  <Collapsible title="Mother Tongue">
                    <View style={styles.collapsibleContent}>
                      <RNText style={styles.collapsibleSubheading}>
                        Select your native language to help us understand your language background.
                      </RNText>
                      {motherTongueOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.onboardingRadioItem,
                            motherTongue === option.id && styles.onboardingRadioItemSelected,
                          ]}
                          onPress={() => setMotherTongue(option.id)}
                        >
                          <View
                            style={[
                              styles.onboardingRadioButton,
                              motherTongue === option.id && styles.onboardingRadioButtonSelected,
                            ]}
                          >
                            {motherTongue === option.id && <View style={styles.onboardingRadioButtonInner} />}
                          </View>
                          <RNText style={styles.onboardingRadioText}>{option.label}</RNText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Collapsible>
                </View>

                {/* Learning Motivation Collapsible */}
                <View style={styles.collapsibleContainer}>
                  <Collapsible title="Learning Motivation">
                    <View style={styles.collapsibleContent}>
                      <RNText style={styles.collapsibleSubheading}>
                        Select your main motivation for learning English.
                      </RNText>
                      {motivationOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.motivationItem,
                            learningMotivation === option.id && styles.motivationItemSelected,
                          ]}
                          onPress={() => setLearningMotivation(option.id)}
                        >
                          <RNText style={styles.motivationIcon}>{option.icon}</RNText>
                          <RNText style={styles.motivationText}>{option.label}</RNText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Collapsible>
                </View>

                {/* Interests Collapsible */}
                <View style={styles.collapsibleContainer}>
                  <Collapsible title="Your Interests">
                    <View style={styles.collapsibleContent}>
                      <RNText style={styles.collapsibleSubheading}>
                        Select topics you're interested in learning about.
                      </RNText>
                      <View style={styles.interestGrid}>
                        {interestOptions.map((option) => (
                          <TouchableOpacity
                            key={option.id}
                            style={[
                              styles.interestCard,
                              selectedInterests.includes(option.id) && styles.interestCardSelected,
                            ]}
                            onPress={() => handleInterestToggle(option.id)}
                          >
                            <View style={styles.interestIconContainer}>
                              <RNText style={styles.interestIcon}>{option.icon}</RNText>
                            </View>
                            <RNText style={styles.interestText}>{option.label}</RNText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </Collapsible>
                </View>

                {/* Focus Areas Collapsible */}
                <View style={styles.collapsibleContainer}>
                  <Collapsible title="Focus Areas">
                    <View style={styles.collapsibleContent}>
                      <RNText style={styles.collapsibleSubheading}>
                        Select skills you want to improve.
                      </RNText>
                      <View style={styles.focusGrid}>
                        {focusAreaOptions.map((option) => (
                          <TouchableOpacity
                            key={option.id}
                            style={[
                              styles.focusCard,
                              selectedFocusAreas.includes(option.id) && styles.focusCardSelected,
                            ]}
                            onPress={() => handleFocusAreaToggle(option.id)}
                          >
                            <View style={styles.focusIconContainer}>
                              <RNText style={styles.focusIcon}>{option.icon}</RNText>
                            </View>
                            <RNText style={styles.focusText}>{option.label}</RNText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </Collapsible>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save button remains outside the ScrollView */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        disabled={loading}
        onPress={handleSave}
      >
        {loading ?
          <ActivityIndicator color="#fff" size="small" /> :
          <RNText style={styles.saveButtonText}>Save Changes</RNText>
        }
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.secondaryLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
    height: 50,
  },
  inputError: {
    borderColor: Colors.light.secondaryLight,
  },
  errorText: {
    color: Colors.light.secondaryLight,
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: Platform.OS === 'ios' ? 36 : 28,
    height: 60,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.secondaryLight,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  phoneInputContainer: {
    backgroundColor: 'lightgrey',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  phoneTextInput: {
    width: '90%',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 16,
    color: Colors.light.text
  },
  // Radio button styles (existing profile fields)
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.secondaryLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  radioItemSelected: {
    borderColor: Colors.light.primary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.secondaryLight,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.light.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  radioText: {
    fontSize: 16,
    color: Colors.light.text,
  },

  // Additional Details Section
  additionalDetailsSection: {
    marginTop: 32,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  collapsibleContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondaryLight,
    borderRadius: 8,
    padding: 16,
  },
  collapsibleContent: {
    marginTop: 16,
  },
  collapsibleSubheading: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },

  // Onboarding style radio buttons (for mother tongue)
  onboardingRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
  },
  onboardingRadioItemSelected: {
    borderColor: '#4b4ac0',
    backgroundColor: '#f8f8ff',
  },
  onboardingRadioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingRadioButtonSelected: {
    borderColor: '#4b4ac0',
  },
  onboardingRadioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4b4ac0',
  },
  onboardingRadioText: {
    fontSize: 16,
    color: '#333',
  },

  // Motivation Styles
  motivationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
  },
  motivationItemSelected: {
    borderColor: '#4b4ac0',
    backgroundColor: '#f8f8ff',
  },
  motivationIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  motivationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  // Interest Grid Styles
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestCard: {
    width: '48%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  interestCardSelected: {
    borderColor: '#4b4ac0',
    backgroundColor: '#f8f8ff',
  },
  interestIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestIcon: {
    fontSize: 24,
  },
  interestText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },

  // Focus Area Grid Styles
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  focusCard: {
    width: '48%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  focusCardSelected: {
    borderColor: '#4b4ac0',
    backgroundColor: '#f8f8ff',
  },
  focusIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  focusIcon: {
    fontSize: 24,
  },
  focusText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
});
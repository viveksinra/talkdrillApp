// ... existing code ...
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Platform, ActivityIndicator, TextInput, Text as RNText, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { uploadImage, updateUserProfile } from '@/api/services/private/userService';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [languageProficiency, setLanguageProficiency] = useState(user?.languageProficiency || '');
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

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

  const getImageSource = (imagePath: string | undefined) => {
    if (!imagePath) {
      return require('@/assets/images/default-avatar-1.jpg');
    }
    // If it's a remote URL
    if (imagePath.startsWith('http')) {
      return { uri: imagePath };
    }
    // If it's a local path
    if (imagePath.includes('default-avatar')) {
      // Extract the avatar number and use require
      const avatarNumber = imagePath.match(/default-avatar-(\d+)/)?.[1] || '1';
      switch (avatarNumber) {
        case '1': return require('@/assets/images/default-avatar-1.jpg');
        case '2': return require('@/assets/images/default-avatar-2.jpg');
        case '3': return require('@/assets/images/default-avatar-3.jpg');
        case '4': return require('@/assets/images/default-avatar-4.jpg');
        case '5': return require('@/assets/images/default-avatar-5.jpg');
        default: return require('@/assets/images/default-avatar-1.jpg');
      }
    }
    // Fallback to default avatar if path is invalid
    return require('@/assets/images/default-avatar-1.jpg');
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
        languageProficiency
      };

      await updateUserProfile(userData);

      updateUser({
        ...user,
        name,
        email,
        profileImage: imageUrl,
        gender,
        languageProficiency
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
      
      {/* Main content area with ScrollView */}
      <View style={styles.contentWrapper}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.content}>
            <View style={styles.avatarContainer}>
              <Image
                source={imageFile ? { uri: profileImage } : getImageSource(user?.profileImage)}
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
            </View>
          </View>
        </ScrollView>
      </View>

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
    paddingBottom: 20, // Add padding at the bottom for better spacing
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondaryLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
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
  // Radio button styles
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
});
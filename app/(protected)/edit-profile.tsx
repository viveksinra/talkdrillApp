// ... existing code ...
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Platform, ActivityIndicator, TextInput, Text as RNText } from 'react-native';
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
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Email validation
  const validateEmail = (emailString: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailString)) {
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
        // setProgress(0.2); 
        const formData = new FormData();
        formData.append('image', {
          uri: imageFile.uri,
          type: 'image/jpeg', // or imageFile.type
          name: imageFile.fileName || 'profile-image.jpg',
        } as any);

        const uploadResponse = await uploadImage(formData, (progressEvent) => {
          
        });
        imageUrl = uploadResponse.imageUrl;
      }

      const userData = {
        name,
        email,
        profileImage: imageUrl,
      };

      await updateUserProfile(userData);

      updateUser({
        ...user,
        name,
        email,
        profileImage: imageUrl,
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
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image
            source={profileImage ? { uri: profileImage } : require('@/assets/images/default-avatar-1.jpg')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editIconContainer} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
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
        </View>
      </View>

      {/* Removed Progress.Bar, loading state handled by button */}

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
    backgroundColor: Colors.light.background, // Assuming ThemedView provides this or similar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40, // Adjust padding for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondaryLight, // Using tint for border
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
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
    bottom: 5, // Adjusted for better visual
    right: 5,  // Adjusted for better visual
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background, // Using background for border for contrast
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20, // Spacing between input groups
  },
  label: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.secondaryLight, // Using tint for border
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.light.background, // Ensuring input bg matches theme
    color: Colors.light.text, // Ensuring text color matches theme
    height: 50, // Consistent height
  },
  inputError: {
    borderColor: Colors.light.secondaryLight, // Error color for border
  },
  errorText: {
    color: Colors.light.secondaryLight,
    fontSize: 12,
    marginTop: 4,
  },
  // Removed progressContainer, progressBar, progressText styles
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: Platform.OS === 'ios' ? 30 : 24, // Adjust for home indicator on iOS
    height: 50,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.secondaryLight, // A more subdued color for disabled state
  },
  saveButtonText: {
    color: '#fff', // White text for button
    fontSize: 18,
    fontWeight: '500',
  },
});
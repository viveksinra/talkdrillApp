import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile, uploadImage } from "@/api/services/private/userService";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountSetupScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [languageProficiency, setLanguageProficiency] = useState("");
  const [allAvatars] = useState([
    "https://talkdrill.s3.eu-west-2.amazonaws.com/manual/characterImage/char1.jpg",
    "https://talkdrill.s3.eu-west-2.amazonaws.com/manual/characterImage/char2.jpg",
    "https://talkdrill.s3.eu-west-2.amazonaws.com/manual/characterImage/char3.jpg",
    "https://talkdrill.s3.eu-west-2.amazonaws.com/manual/characterImage/char4.jpg",
    "https://talkdrill.s3.eu-west-2.amazonaws.com/manual/characterImage/char5.jpg",
  ]);
  const [selectedAvatar, setSelectedAvatar] = useState(allAvatars[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [username, setUsername] = useState("");

  // Use effect to handle navigation outside the render cycle
  useEffect(() => {
    if (isCompleted) {
      // Navigate to onboarding instead of tabs
      router.replace("/(protected)/onboarding" as any);
    }
  }, [isCompleted, router]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCustomImage(result.assets[0].uri);
        setImageFile(result.assets[0]);
        // Clear selected avatar when custom image is selected
        setSelectedAvatar('');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error selecting image. Please try again.');
    }
  };

  const handleNext = useCallback(async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // On the last step, submit the profile update
      try {
        setIsSubmitting(true);
        
        // Validate required fields
        if (!firstName || !lastName) {
          Alert.alert("Error", "First name and last name are required");
          return;
        }
        
        if (!gender) {
          Alert.alert("Error", "Please select your gender");
          return;
        }

        if (!languageProficiency) {
          Alert.alert("Error", "Please select your language proficiency");
          return;
        }
        
        // Format gender to match backend enum (lowercase)
        let formattedGender = gender.toLowerCase();
        if (formattedGender === "non-binary" || formattedGender === "prefer not to say") {
          formattedGender = "others";
        }
        
        // Handle image upload if custom image selected
        let profileImageUrl = null;
        
        if (imageFile) {
          try {
            const formData = new FormData();
            formData.append('image', {
              uri: imageFile.uri,
              type: 'image/jpeg',
              name: imageFile.fileName || 'profile-image.jpg',
            } as any);

            const uploadResponse = await uploadImage(formData);
            profileImageUrl = uploadResponse.imageUrl;
          } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', 'Failed to upload profile image. Please try again.');
            setIsSubmitting(false);
            return;
          }
        }
        
        // Prepare data for API call
        const profileData = {
          name: `${firstName} ${lastName}`,
          gender: formattedGender,
          languageProficiency,
          // If custom image was uploaded, use its URL
          // Otherwise, store the avatar number (1-5) based on index
          profileImage: profileImageUrl ?? selectedAvatar
        };

       
        
        // Call API to update profile
        const response = await updateUserProfile(profileData);
        
        // Update local user data
        if (response && response.myData && response.myData.user) {
          updateUser(response.myData.user);
        }
        
        // Set completed flag to trigger navigation
        setIsCompleted(true);
      } catch (error) {
        console.error("Error updating profile:", error);
        Alert.alert(
          "Error",
          "Failed to update profile. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentStep, totalSteps, firstName, lastName, gender, languageProficiency, selectedAvatar, imageFile, allAvatars, updateUser]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => {
    const progressWidth = `${(currentStep / totalSteps) * 100}%`;

    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: progressWidth as any }]} />
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>What's your name?</Text>
            <Text style={styles.subheading}>
              We'll use this to personalize your experience.
            </Text>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>Select your gender</Text>
            <Text style={styles.subheading}>
              This helps us personalize your learning experience.
            </Text>

            <TouchableOpacity
              style={[
                styles.radioItem,
                gender === "Male" && styles.radioItemSelected,
              ]}
              onPress={() => setGender("Male")}
            >
              <View
                style={[
                  styles.radioButton,
                  gender === "Male" && styles.radioButtonSelected,
                ]}
              >
                {gender === "Male" && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioText}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioItem,
                gender === "Female" && styles.radioItemSelected,
              ]}
              onPress={() => setGender("Female")}
            >
              <View
                style={[
                  styles.radioButton,
                  gender === "Female" && styles.radioButtonSelected,
                ]}
              >
                {gender === "Female" && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={styles.radioText}>Female</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioItem,
                gender === "Non-binary" && styles.radioItemSelected,
              ]}
              onPress={() => setGender("Non-binary")}
            >
              <View
                style={[
                  styles.radioButton,
                  gender === "Non-binary" && styles.radioButtonSelected,
                ]}
              >
                {gender === "Non-binary" && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={styles.radioText}>Non-binary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioItem,
                gender === "Prefer not to say" && styles.radioItemSelected,
              ]}
              onPress={() => setGender("Prefer not to say")}
            >
              <View
                style={[
                  styles.radioButton,
                  gender === "Prefer not to say" && styles.radioButtonSelected,
                ]}
              >
                {gender === "Prefer not to say" && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={styles.radioText}>Prefer not to say</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.heading}>Select your language proficiency</Text>
              <Text style={styles.subheading}>
                This helps us personalize your learning experience.
              </Text>
  
              <TouchableOpacity
                style={[
                  styles.radioItem,
                  languageProficiency === "beginner" && styles.radioItemSelected,
                ]}
                onPress={() => setLanguageProficiency("beginner")}
              >
                <View
                  style={[
                    styles.radioButton,
                    languageProficiency === "beginner" && styles.radioButtonSelected,
                  ]}
                >
                  {languageProficiency === "beginner" && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.radioText}>Beginner</Text>
              </TouchableOpacity>
  
              <TouchableOpacity
                style={[
                  styles.radioItem,
                  languageProficiency === "intermediate" && styles.radioItemSelected,
                ]}
                onPress={() => setLanguageProficiency("intermediate")}
              >
                <View
                  style={[
                    styles.radioButton,
                    languageProficiency === "intermediate" && styles.radioButtonSelected,
                  ]}
                >
                  {languageProficiency === "intermediate" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioText}>Intermediate</Text>
              </TouchableOpacity>
  
              <TouchableOpacity
                style={[
                  styles.radioItem,
                  languageProficiency === "advanced" && styles.radioItemSelected,
                ]}
                onPress={() => setLanguageProficiency("advanced")}
              >
                <View
                  style={[
                    styles.radioButton,
                    languageProficiency === "advanced" && styles.radioButtonSelected,
                  ]}
                >
                  {languageProficiency === "advanced" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioText}>Advanced</Text>
              </TouchableOpacity>
            </View>
          );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>Profile picture</Text>
            <Text style={styles.subheading}>
              Choose an avatar or upload your own photo.
            </Text>

            <View style={styles.selectedAvatarContainer}>
              <View style={styles.avatarCircle}>
                {customImage ? (
                  <Image source={{ uri: customImage }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: "#f0f0f0" }]}>
                    <Image 
                      source={{uri: selectedAvatar}} 
                      style={styles.avatarImage} 
                    />
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.avatarSectionTitle}>Choose an avatar</Text>

            <View style={styles.avatarGrid}>
              {allAvatars.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar && styles.selectedAvatarOption,
                  ]}
                  onPress={() => {
                    setSelectedAvatar(avatar);
                    setCustomImage(null);
                    setImageFile(null);
                  }}
                >
                  <View style={styles.avatarImagePlaceholder}>
                    <Image source={{uri: avatar}} style={styles.avatarImage} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={pickImage}
            >
              <Text style={styles.uploadButtonText}>Upload from library</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const renderNavigation = () => {
    return (
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting && currentStep === totalSteps ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>
              {currentStep < totalSteps ? "Continue" : "Complete Account Setup"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
     <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {renderProgressBar()}
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={handleBack}
            disabled={currentStep === 1}
          >
            <Text
              style={[
                styles.backIcon,
                currentStep === 1 && styles.backIconDisabled,
              ]}
            >
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Setup</Text>
          <Text style={styles.stepIndicator}>
            {currentStep}/{totalSteps}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.contentContainer}>{renderStep()}</ScrollView>

      {renderNavigation()}
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4b4ac0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backIconButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 16,
    color: "#4b4ac0",
  },
  backIconDisabled: {
    color: "#cccccc",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  stepIndicator: {
    fontSize: 16,
    color: "#666",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContainer: {
    paddingVertical: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#222",
  },
  subheading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  radioItemSelected: {
    borderColor: "#4b4ac0",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: "#4b4ac0",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4b4ac0",
  },
  radioText: {
    fontSize: 16,
    color: "#333",
  },
  selectedAvatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    // borderWidth: 2,
    borderColor: "#4b4ac0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
    color: "#444",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 12,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  selectedAvatarOption: {
    borderColor: "#4b4ac0",
    // borderWidth: 2,
  },
  avatarImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#4b4ac0",
    borderRadius: 8,
    marginTop: 8,
  },
  uploadButtonText: {
    color: "#4b4ac0",
    fontSize: 16,
    fontWeight: "500",
  },
  usernameHint: {
    fontSize: 14,
    color: "#666",
    marginTop: -12,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  continueButton: {
    flex: 1,
    backgroundColor: "#4b4ac0",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

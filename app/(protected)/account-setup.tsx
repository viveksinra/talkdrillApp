import { useRouter } from "expo-router";
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
} from "react-native";

export default function AccountSetupScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isCompleted, setIsCompleted] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [allAvatars] = useState([
    require("@/assets/images/default-avatar-1.jpg"),
    require("@/assets/images/default-avatar-2.jpg"),
    require("@/assets/images/default-avatar-3.jpg"),
    require("@/assets/images/default-avatar-4.jpg"),
    require("@/assets/images/default-avatar-5.jpg"),
  ]);
  const [selectedAvatar, setSelectedAvatar] = useState(allAvatars[0]);
  const [username, setUsername] = useState("");

  // Use effect to handle navigation outside the render cycle
  useEffect(() => {
    if (isCompleted) {
      // Perform navigation in an effect, not during render
      router.replace("/(tabs)");
    }
  }, [isCompleted, router]);

  const handleNext = useCallback(() => {
    console.log("currentStep", currentStep);
    console.log("totalSteps", totalSteps);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Instead of immediately navigating, set a flag
      setIsCompleted(true);
    }
  }, [currentStep, totalSteps]);

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
            <Text style={styles.heading}>Profile picture</Text>
            <Text style={styles.subheading}>
              Choose an avatar or upload your own photo.
            </Text>

            <View style={styles.selectedAvatarContainer}>
              <View style={styles.avatarCircle}>
                {/* Placeholder for avatar image */}
                <View style={[styles.avatar, { backgroundColor: "#f0f0f0" }]}>
                  <Image source={selectedAvatar} style={styles.avatarImage} />
                </View>
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
                  onPress={() => setSelectedAvatar(avatar)}
                >
                  <View style={styles.avatarImagePlaceholder}>
                    <Image source={avatar} style={styles.avatarImage} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload from library</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>Choose a username</Text>
            <Text style={styles.subheading}>
              This will be your unique identifier in the community.
            </Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
            />

            <Text style={styles.usernameHint}>
              Username must be at least 4 characters and can include letters,
              numbers, and underscores.
            </Text>
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
        >
          <Text style={styles.continueButtonText}>
            {currentStep < totalSteps ? "Continue" : "Complete Account Setup"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
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

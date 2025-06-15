import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { updateUserOnboarding } from "@/api/services/private/userService";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0); // Start with intro screen
  const totalSteps = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isPlanReady, setIsPlanReady] = useState(false);

  // Form state
  const [motherTongue, setMotherTongue] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");
  const [learningMotivation, setLearningMotivation] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);

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

  const handleNext = useCallback(async () => {
    if (currentStep === 0) {
      // Intro screen - go to step 1
      setCurrentStep(1);
      return;
    }

    if (currentStep < totalSteps) {
      // Validate current step
      if (currentStep === 1 && !motherTongue) {
        Alert.alert("Error", "Please select your mother tongue");
        return;
      }
      if (currentStep === 2 && !englishLevel) {
        Alert.alert("Error", "Please select your English level");
        return;
      }
      if (currentStep === 3 && !learningMotivation) {
        Alert.alert("Error", "Please select your learning motivation");
        return;
      }
      if (currentStep === 4 && selectedInterests.length === 0) {
        Alert.alert("Error", "Please select at least one interest");
        return;
      }
      if (currentStep === 5 && selectedFocusAreas.length === 0) {
        Alert.alert("Error", "Please select at least one focus area");
        return;
      }

      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit onboarding data
      try {
        setIsSubmitting(true);
        setIsCreatingPlan(true);

        const onboardingData = {
          motherTongue,
          learningMotivation,
          interests: selectedInterests,
          focusAreas: selectedFocusAreas,
        };

        // Simulate plan creation delay
        setTimeout(async () => {
          try {
            const response = await updateUserOnboarding(onboardingData);
            
            if (response && response.myData && response.myData.user) {
              updateUser(response.myData.user);
            }
            
            setIsCreatingPlan(false);
            setIsPlanReady(true);
          } catch (error) {
            console.error("Error completing onboarding:", error);
            setIsCreatingPlan(false);
            Alert.alert("Error", "Failed to complete onboarding. Please try again.");
          } finally {
            setIsSubmitting(false);
          }
        }, 3000); // 3 second delay for plan creation animation

      } catch (error) {
        console.error("Error completing onboarding:", error);
        Alert.alert("Error", "Failed to complete onboarding. Please try again.");
        setIsSubmitting(false);
        setIsCreatingPlan(false);
      }
    }
  }, [currentStep, totalSteps, motherTongue, englishLevel, learningMotivation, selectedInterests, selectedFocusAreas, updateUser]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToDashboard = () => {
    router.replace("/(protected)/(tabs)");
  };

  const renderProgressBar = () => {
    if (currentStep === 0 || isCreatingPlan || isPlanReady) return null;
    
    const progressWidth = `${(currentStep / totalSteps) * 100}%`;

    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: progressWidth as any }]} />
      </View>
    );
  };

  const renderIntroScreen = () => (
    <View style={styles.introContainer}>
      <Image 
        source={require("@/assets/images/onboarding-intro.jpg")}
        style={styles.introImage}
        resizeMode="cover"
      />
      <View style={styles.introContent}>
        <Text style={styles.introTitle}>Let's personalize your learning journey</Text>
        <Text style={styles.introSubtitle}>
          We have a few questions to learn about you and your goals. This will help us build the 
          best study plan for you!
        </Text>
        <View style={styles.audioOption}>
          <View style={styles.audioIcon}>
            <Text style={styles.audioIconText}>🎧</Text>
          </View>
          <Text style={styles.audioText}>Optional audio introduction available</Text>
        </View>
      </View>
    </View>
  );

  const renderCreatingPlan = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIcon}>
        <ActivityIndicator size="large" color="#4b4ac0" />
      </View>
      <Text style={styles.loadingTitle}>Creating your personalized plan...</Text>
      <View style={styles.loadingBars}>
        <View style={[styles.loadingBar, { width: '60%' }]} />
        <View style={[styles.loadingBar, { width: '30%' }]} />
        <View style={[styles.loadingBar, { width: '80%' }]} />
      </View>
    </View>
  );

  const renderPlanReady = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Your plan is ready!</Text>
      <Text style={styles.successSubtitle}>
        We've created a personalized learning plan based on your profile. Let's start your 
        English learning journey!
      </Text>
    </View>
  );

  const renderStep = () => {
    if (currentStep === 0) return renderIntroScreen();
    if (isCreatingPlan) return renderCreatingPlan();
    if (isPlanReady) return renderPlanReady();

    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>What's your mother tongue?</Text>
            <Text style={styles.subheading}>
              This helps us understand your language background.
            </Text>
            <Text style={styles.label}>Mother Tongue</Text>
            
            {motherTongueOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.radioItem,
                  motherTongue === option.id && styles.radioItemSelected,
                ]}
                onPress={() => setMotherTongue(option.id)}
              >
                <View
                  style={[
                    styles.radioButton,
                    motherTongue === option.id && styles.radioButtonSelected,
                  ]}
                >
                  {motherTongue === option.id && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.radioText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>Your English level?</Text>
            <Text style={styles.subheading}>
              Select your current proficiency level.
            </Text>

            <TouchableOpacity
              style={[
                styles.radioItem,
                englishLevel === "beginner" && styles.radioItemSelected,
              ]}
              onPress={() => setEnglishLevel("beginner")}
            >
              <View
                style={[
                  styles.radioButton,
                  englishLevel === "beginner" && styles.radioButtonSelected,
                ]}
              >
                {englishLevel === "beginner" && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioText}>Beginner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioItem,
                englishLevel === "intermediate" && styles.radioItemSelected,
              ]}
              onPress={() => setEnglishLevel("intermediate")}
            >
              <View
                style={[
                  styles.radioButton,
                  englishLevel === "intermediate" && styles.radioButtonSelected,
                ]}
              >
                {englishLevel === "intermediate" && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioText}>Intermediate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioItem,
                englishLevel === "advanced" && styles.radioItemSelected,
              ]}
              onPress={() => setEnglishLevel("advanced")}
            >
              <View
                style={[
                  styles.radioButton,
                  englishLevel === "advanced" && styles.radioButtonSelected,
                ]}
              >
                {englishLevel === "advanced" && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioText}>Advanced</Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>Why do you want to learn English?</Text>
            <Text style={styles.subheading}>
              Select your main motivation for learning English.
            </Text>

            {motivationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.motivationItem,
                  learningMotivation === option.id && styles.motivationItemSelected,
                ]}
                onPress={() => setLearningMotivation(option.id)}
              >
                <Text style={styles.motivationIcon}>{option.icon}</Text>
                <Text style={styles.motivationText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>Your interests</Text>
            <Text style={styles.subheading}>
              Select topics you're interested in learning about.
            </Text>

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
                    <Text style={styles.interestIcon}>{option.icon}</Text>
                  </View>
                  <Text style={styles.interestText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heading}>What do you want to focus on?</Text>
            <Text style={styles.subheading}>
              Select skills you want to improve.
            </Text>

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
                    <Text style={styles.focusIcon}>{option.icon}</Text>
                  </View>
                  <Text style={styles.focusText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderNavigation = () => {
    if (isCreatingPlan) return null;
    
    if (isPlanReady) {
      return (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={goToDashboard}
          >
            <Text style={styles.continueButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentStep === 0) {
      return (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleNext}
          >
            <Text style={styles.continueButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      );
    }

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
              {currentStep < totalSteps ? "Continue" : "Create My Plan"}
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
          {currentStep > 0 && !isCreatingPlan && !isPlanReady && (
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
              <Text style={styles.headerTitle}>Profile Setup</Text>
              <Text style={styles.stepIndicator}>
                Step {currentStep} of {totalSteps}
              </Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

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
  
  // Intro Screen Styles
  introContainer: {
    flex: 1,
    alignItems: 'center',
  },
  introImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 32,
  },
  introContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#222',
  },
  introSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  audioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  audioIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#e8e7ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioIconText: {
    fontSize: 20,
  },
  audioText: {
    fontSize: 16,
    color: '#4b4ac0',
    fontWeight: '500',
  },

  // Step Container Styles
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
    marginBottom: 16,
    color: "#444",
  },

  // Radio Button Styles
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
    backgroundColor: "#f8f8ff",
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

  // Motivation Styles
  motivationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  motivationItemSelected: {
    borderColor: "#4b4ac0",
    backgroundColor: "#f8f8ff",
  },
  motivationIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  motivationText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },

  // Interest Grid Styles
  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  interestCard: {
    width: "48%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    padding: 16,
  },
  interestCardSelected: {
    borderColor: "#4b4ac0",
    backgroundColor: "#f8f8ff",
  },
  interestIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#f0f0f0",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  interestIcon: {
    fontSize: 24,
  },
  interestText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },

  // Focus Area Grid Styles
  focusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  focusCard: {
    width: "48%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    padding: 16,
  },
  focusCardSelected: {
    borderColor: "#4b4ac0",
    backgroundColor: "#f8f8ff",
  },
  focusIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#f0f0f0",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  focusIcon: {
    fontSize: 24,
  },
  focusText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },

  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#e8e7ff",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
    color: "#222",
  },
  loadingBars: {
    width: "100%",
    paddingHorizontal: 40,
  },
  loadingBar: {
    height: 8,
    backgroundColor: "#4b4ac0",
    borderRadius: 4,
    marginBottom: 8,
  },

  // Success Screen Styles
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#e8e7ff",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  successIconText: {
    fontSize: 32,
    color: "#4b4ac0",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#222",
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    lineHeight: 24,
  },

  // Navigation Styles
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
    justifyContent: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

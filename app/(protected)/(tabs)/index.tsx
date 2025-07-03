import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAICharacters } from "@/api/services/public/aiCharacters";
import { fetchProfessionals, Professional } from "@/api/services/public/professionalService";
import { Colors } from "@/constants/Colors";
import { FilterDialog, FilterOptions } from "@/components/FilterDialog";
import { useSocket } from "@/contexts/SocketContext";
import { post } from "@/api/config/axiosConfig";

// Define the AICharacter interface for type safety
interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  profileImage: string;
  tags: string[];
  expertiseLevel: string;
  gender: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [popularCharacters, setPopularCharacters] = useState<AICharacter[]>([]);
  const [popularProfessionals, setPopularProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);
  const [filterDialogHeaderTitle, setFilterDialogHeaderTitle] =
    useState("Find Partner");
  const [filterDialogHeaderSubtitle, setFilterDialogHeaderSubtitle] = useState(
    "Customize your conversation partner"
  );
  const [isFindAIAssistant, setIsFindAIAssistant] = useState(false);
  const [allCharacters, setAllCharacters] = useState<AICharacter[]>([]);

  // Fetch popular AI characters and professionals on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load AI Characters
        const charactersData = await fetchAICharacters();
        setAllCharacters(charactersData);
        setPopularCharacters(charactersData.slice(0, 6));

        // Load Professionals
        const professionalsData = await fetchProfessionals({
          page: 1,
          limit: 6,
          sortBy: 'averageRating',
          sortOrder: 'desc'
        });
        setPopularProfessionals(professionalsData.professionals);
        
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const renderCharacterItem = ({ item }: { item: AICharacter }) => (
    <TouchableOpacity
      style={styles.characterCard}
      onPress={() => router.push(`/(protected)/ai-character/${item._id}`)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.profileImage || "https://via.placeholder.com/150",
          }}
          style={styles.characterImage}
        />
        <View
          style={[
            styles.badgeContainer,
            item.profession?.toLowerCase().includes("intermediate")
              ? styles.intermediateBadge
              : item.profession?.toLowerCase().includes("advanced")
              ? styles.advancedBadge
              : styles.beginnerBadge,
          ]}
        >
          <ThemedText style={styles.badgeText}>
            {item.profession?.toLowerCase().includes("intermediate")
              ? "Intermediate"
              : item.profession?.toLowerCase().includes("advanced")
              ? "Advanced"
              : "Beginner"}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardContentContainer}>
        <View style={styles.cardHeader}>
          <ThemedText
            style={styles.characterName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name.length > 10 ? item.name.slice(0, 10) + "..." : item.name}
          </ThemedText>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFC107" />
            <ThemedText style={styles.ratingText}>4.9</ThemedText>
          </View>
        </View>

        <ThemedText
          style={styles.characterProfession}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.profession}
        </ThemedText>

        <View style={styles.statsContainer}>
          <View style={styles.sessionsContainer}>
            <Ionicons name="time-outline" size={16} color="#2196F3" />
            <ThemedText style={styles.sessionsText}>238 sessions</ThemedText>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.onlineIndicator} />
            <ThemedText style={styles.statusText}>Online</ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startSessionButton}
          onPress={() => router.push(`/(protected)/ai-character/${item._id}`)}
        >
          <ThemedText style={styles.startSessionText}>Start Session</ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderProfessionalItem = ({ item }: { item: Professional }) => (
    <TouchableOpacity
      style={styles.characterCard}
      onPress={() => router.push(`/(protected)/professional-profile/${item._id}`)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.profileImage || "https://via.placeholder.com/150",
          }}
          style={styles.characterImage}
        />
        <View
          style={[
            styles.badgeContainer,
            item.isAvailableForBooking 
              ? styles.availableBadge
              : styles.busyBadge,
          ]}
        >
          <ThemedText style={styles.badgeText}>
            {item.isAvailableForBooking ? "Available" : "Busy"}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardContentContainer}>
        <View style={styles.cardHeader}>
          <ThemedText
            style={styles.characterName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name.length > 10 ? item.name.slice(0, 10) + "..." : item.name}
          </ThemedText>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFC107" />
            <ThemedText style={styles.ratingText}>
              {item.averageRating > 0 ? item.averageRating.toFixed(1) : '4.9'}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          style={styles.characterProfession}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.specializations.length > 0 
            ? item.specializations[0].replace('_', ' ').toUpperCase()
            : 'Medical Doctor'}
        </ThemedText>

        <View style={styles.statsContainer}>
          <View style={styles.sessionsContainer}>
            <Ionicons name="time-outline" size={16} color="#2196F3" />
            <ThemedText style={styles.sessionsText}>
              {item.completedSessions} sessions
            </ThemedText>
          </View>

          <View style={styles.statusContainer}>
            <Ionicons name="wallet-outline" size={16} color="#50E3C2" />
            <ThemedText style={styles.statusText}>₹{item.hourlyRate}/hr</ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookSessionButton}
          onPress={() => router.push(`/(protected)/professional-profile/${item._id}`)}
        >
          <ThemedText style={styles.bookSessionText}>Book Session</ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const handleStartMatching = async (filters: FilterOptions) => {
    // Map filter options to the format expected by the backend
    const userGender = user?.gender || "male"; // Default to male if not set

    const partnerGender = filters.gender === "any" ? "any" : filters.gender;
    const partnerAccent =
      filters.accent === "indian" ? "indian" : filters.accent;
    const languageProficiency =
      filters.englishLevel === "any" ? "any" : filters.englishLevel;

    if (isFindAIAssistant) {
      console.log(partnerGender, languageProficiency);
      // find appropriate ai character based on filters
      const aiCharacter = allCharacters.find(
        (character) =>
          (partnerGender === "any" ||
            character.gender === partnerGender) &&
          (languageProficiency === "any" ||
            character.expertiseLevel === languageProficiency)
      );

      // if no ai character found, show a message
      if (!aiCharacter) {
        Alert.alert("No AI character found");
        return;
      }

      // start a conversation with the ai character
      let conversationId = await handleStartConversation(
        aiCharacter._id,
        "video"
      );

      // if conversation is not started, show a message
      if (!conversationId) {
        Alert.alert(
          "Error",
          "Failed to start conversation. Please try again later."
        );
        return;
      }

      // navigate to the conversation screen
      router.push({
        pathname: "/(protected)/ai-video/[id]",
        params: {
          id: conversationId,
          gender: partnerGender === "any" ? "male" : partnerGender,
          accent: partnerAccent,
          languageProficiency: languageProficiency,
          aiCharacterName: aiCharacter.name
        },
      });
    } else {
      router.push({
        pathname: "/match-making",
        params: {
          userGender,
          partnerGender,
          languageProficiency,
        },
      });
    }
  };

  const handleStartConversation = async (
    characterId: string,
    callType: "video"
  ) => {
    if (!characterId) return null;

    try {
      const response = await post("/api/v1/ai-conversations", {
        characterId,
        callType,
      });
      const conversation = response.data.data;
      // Navigate to appropriate screen based on call type
      return conversation._id;
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to start conversation. Please try again later."
      );
      console.error("Error starting conversation:", err);
      return null;
    }
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFF" />
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/talkdrill_logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
              <NotificationBell color="#000" size={24} />
              <TouchableOpacity onPress={() => router.push("/settings")}>
                <IconSymbol size={24} name="gear" color="#000" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <ThemedView style={styles.greetingContainer}>
              <ThemedText type="title">
                Hello, {user?.name.split(" ")[0] || "User"}!
              </ThemedText>
              <ThemedText
                style={{ fontWeight: "300", color: Colors.light.secondary }}
              >
                Ready to improve your English today?
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.sectionTitle}>
              <ThemedText type="defaultSemiBold">
                Choose Your Practice Method
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.practiceOptionsContainer}>
              <ThemedView style={styles.practiceCard}>
                <View style={styles.practiceCardHeader}>
                  <Image
                    source={require("@/assets/images/ai-assistant-icon.jpg")}
                    style={styles.practiceIcon}
                    defaultSource={require("@/assets/images/ai-assistant-icon.jpg")}
                  />
                  <ThemedText type="subtitle">Speak with AI</ThemedText>
                </View>

                <ThemedText style={styles.practiceDescription}>
                  Practice English with our intelligent AI assistant. Receive
                  instant feedback and corrections.
                </ThemedText>

                <View style={styles.practiceCardFooter}>
                  <ThemedText style={styles.availabilityText}>
                    Available 24/7
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setIsFindAIAssistant(true);
                      setFilterDialogVisible(true);
                      setFilterDialogHeaderTitle("Find AI Assistant");
                      setFilterDialogHeaderSubtitle(
                        "Customize your conversation AI assistant"
                      );
                    }}
                  >
                    <ThemedText style={styles.actionButtonText}>
                      Start Conversation
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>

              <ThemedView style={styles.practiceCard}>
                <View style={styles.practiceCardHeader}>
                  <Image
                    source={require("@/assets/images/peer-practice-icon.jpg")}
                    style={styles.practiceIcon}
                    defaultSource={require("@/assets/images/peer-practice-icon.jpg")}
                  />
                  <ThemedText type="subtitle">Peer Practice</ThemedText>
                </View>

                <ThemedText style={styles.practiceDescription}>
                  Connect with language partners around the world for real
                  conversations.
                </ThemedText>

                <View style={styles.practiceCardFooter}>
                  <ThemedText style={styles.availabilityText}>
                    {onlineUsers.length
                      ? onlineUsers.length - 1 === 1
                        ? "1 user"
                        : onlineUsers.length - 1 > 1
                        ? `${onlineUsers.length - 1} users`
                        : "No users"
                      : "No users"}{" "}
                    online
                  </ThemedText>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.peerActionButton]}
                    onPress={() => router.push("/peer-practice")}
                  >
                    <ThemedText style={styles.actionButtonText}>
                      Find Partner
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </ThemedView>

            {/* Popular AI Characters Section */}
            <ThemedView style={styles.recentSection}>
              <ThemedText type="subtitle">Popular AI Characters</ThemedText>
              <TouchableOpacity
                onPress={() => router.push("/(protected)/(tabs)/ai-characters")}
              >
                <ThemedText style={styles.viewAllText}>View All</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.charactersContainer}
            >
              {popularCharacters.map((character) => (
                <View key={character._id} style={{ marginRight: 16 }}>
                  {renderCharacterItem({ item: character })}
                </View>
              ))}
            </ScrollView>

            {/* Talk with Professionals Section */}
            <ThemedView style={styles.recentSection}>
              <ThemedText type="subtitle">Talk with Professionals</ThemedText>
              <TouchableOpacity
                onPress={() => router.push("/(protected)/professionals")}
              >
                <ThemedText style={styles.viewAllText}>View All</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.charactersContainer}
            >
              {popularProfessionals.map((professional) => (
                <View key={professional._id} style={{ marginRight: 16 }}>
                  {renderProfessionalItem({ item: professional })}
                </View>
              ))}
            </ScrollView>

            
          </ScrollView>
          <FilterDialog
            headerTitle={filterDialogHeaderTitle}
            headerSubtitle={filterDialogHeaderSubtitle}
            visible={filterDialogVisible}
            onClose={() => setFilterDialogVisible(false)}
            onApply={handleStartMatching}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFF",
  },
  headerLogo: {
    height: 32,
    width: 120,
  },
  greetingContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  practiceOptionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  practiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  practiceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  practiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  practiceDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    color: "#444444",
  },
  practiceCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  availabilityText: {
    fontSize: 14,
    color: "#673AB7",
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: "#5933F9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  peerActionButton: {
    backgroundColor: "#F7941D",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  recentSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    color: "#4A86E8",
    fontSize: 16,
    fontWeight: "500",
  },
  charactersContainer: {
    paddingBottom: 24,
  },
  // Character card styles
  characterCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  cardContentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  characterName: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    marginRight: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: "600",
  },
  characterProfession: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sessionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  sessionsText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CD964",
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#4CD964",
  },
  startSessionButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  startSessionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    width: 120,
    position: "relative",
  },
  characterImage: {
    width: 120,
    height: "100%",
    resizeMode: "cover",
  },
  badgeContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  advancedBadge: {
    backgroundColor: "rgba(255, 100, 100, 0.8)",
  },
  intermediateBadge: {
    backgroundColor: "rgba(255, 152, 0, 0.8)",
  },
  beginnerBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.8)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    padding: 24,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: "#4A86E8",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "500",
  },
  availableBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.8)",
  },
  busyBadge: {
    backgroundColor: "rgba(255, 100, 100, 0.8)",
  },
  bookSessionButton: {
    backgroundColor: "#5933F9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  bookSessionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

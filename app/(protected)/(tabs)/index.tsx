import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAICharacters } from "@/api/services/public/aiCharacters";
import { Colors } from "@/constants/Colors";
import { FilterDialog, FilterOptions } from "@/components/FilterDialog";

// Define the AICharacter interface for type safety
interface AICharacter {
  _id: string;
  name: string;
  profession: string;
  profileImage: string;
  tags: string[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [popularCharacters, setPopularCharacters] = useState<AICharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);

  // Fetch popular AI characters on component mount
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoading(true);
        const data = await fetchAICharacters();
        // Take first 5 characters for the popular section
        setPopularCharacters(data.slice(0, 6));
      } catch (error) {
        console.error("Error loading popular AI characters:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, []);

  const renderCharacterItem = ({ item }: { item: AICharacter }) => (
    <TouchableOpacity
      style={styles.characterCard}
      onPress={() => router.push(`/(protected)/ai-character/${item._id}`)}
    >
      <View style={styles.cardContentContainer}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.characterName}>{item.name}</ThemedText>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFC107" />
            <ThemedText style={styles.ratingText}>4.8</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.characterProfession}>
          {item.profession}
        </ThemedText>

        <View style={styles.statsContainer}>
          <View style={styles.sessionsContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Colors.light.primary}
            />
            <ThemedText style={styles.sessionsText}>412 sessions</ThemedText>
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

      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.profileImage || "https://via.placeholder.com/150",
          }}
          style={styles.characterImage}
        />
        <View style={styles.badgeContainer}>
          <ThemedText style={styles.badgeText}>Intermediate</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleApplyFilters = (filters: FilterOptions) => {
    console.log("Applied filters:", filters);
    router.push({
      pathname: "/peer-filter",
      params: {
        mode: "chat",
        gender: filters.gender,
        level: filters.englishLevel,
      },
    });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Image 
          source={require('@/assets/images/talkdrill_logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <IconSymbol size={24} name="gear" color="#000" />
          </TouchableOpacity>
          {/* TODO: Add notifications */}
          {/* <TouchableOpacity onPress={() => router.push("/notifications")}>
            <IconSymbol size={24} name="bell.fill" color="#000" />
          </TouchableOpacity> */}
        </View>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <ThemedView style={styles.greetingContainer}>
          <ThemedText type="title">
            Hello, {user?.name.split(" ")[0] || "User"}!
          </ThemedText>
          <ThemedText style={{fontWeight:'300', color: Colors.light.secondary}}>
           Ready to improve your English today?
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionTitle}>
          <ThemedText type="defaultSemiBold">Choose Your Practice Method</ThemedText>
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
                onPress={() => router.push("/(protected)/ai-characters")}
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
                28 users online
              </ThemedText>
              <TouchableOpacity
                style={[styles.actionButton, styles.peerActionButton]}
                onPress={() => setFilterDialogVisible(true)}
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
            onPress={() => router.push("/(protected)/ai-characters")}
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
      </ScrollView>
      <FilterDialog
        visible={filterDialogVisible}
        onClose={() => setFilterDialogVisible(false)}
        onApply={handleApplyFilters}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  greetingContainer: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerLogo: {
    height: 32,
    width: 120,
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
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardContentContainer: {
    flex: 1,
    marginRight: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  characterName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  characterProfession: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sessionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sessionsText: {
    color: Colors.light.primary,
    marginLeft: 6,
    fontWeight: "500",
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F7EE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: {
    color: "#4CAF50",
    fontWeight: "500",
    fontSize: 12,
  },
  startSessionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  startSessionText: {
    color: Colors.light.background,
    fontWeight: "600",
    fontSize: 14,
  },
  imageContainer: {
    position: "relative",
  },
  characterImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  badgeContainer: {
    position: "absolute",
    bottom: -6,
    left: 0,
    right: 0,
    backgroundColor: "#FF9800",
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
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
});

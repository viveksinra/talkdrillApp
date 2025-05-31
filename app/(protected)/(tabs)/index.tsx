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
import { useSocket } from "@/contexts/SocketContext";

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
  const { onlineUsers } = useSocket();
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

  // Set up socket connection to get online user count
  // useEffect(() => {
  //   if (!user?.id) return;

  //   // Connect socket if not already connected
  //   const socket = socketService.connect(user.id);
    
  //   // Register user as online
  //   socketService.sendUserOnline(user.id);

  //   // Listen for online users count updates
  //   const handleOnlineUsersUpdate = (data: {count: number}) => {
  //     console.log('Online users count update:', data);
  //     setOnlineUsers(data.count);
  //   };
    
  //   socketService.on('online_users_count', handleOnlineUsersUpdate);
    
  //   // Request online users count from server
  //   socketService.emit('get_online_users_count', {});
    
  //   // Cleanup on unmount
  //   return () => {
  //     socketService.off('online_users_count', handleOnlineUsersUpdate);
  //   };
  // }, [user?.id]);

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
        <View style={[styles.badgeContainer, 
          item.profession?.toLowerCase().includes('intermediate') 
            ? styles.intermediateBadge 
            : item.profession?.toLowerCase().includes('advanced') 
              ? styles.advancedBadge 
              : styles.beginnerBadge
        ]}>
          <ThemedText style={styles.badgeText}>
            {item.profession?.toLowerCase().includes('intermediate') 
              ? 'Intermediate' 
              : item.profession?.toLowerCase().includes('advanced') 
                ? 'Advanced' 
                : 'Beginner'}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardContentContainer}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.characterName} numberOfLines={1} ellipsizeMode="tail">
            {item.name.length > 10 ? item.name.slice(0, 10) + '...' : item.name}
          </ThemedText>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFC107" />
            <ThemedText style={styles.ratingText}>4.9</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.characterProfession} numberOfLines={1} ellipsizeMode="tail">
          {item.profession}
        </ThemedText>

        <View style={styles.statsContainer}>
          <View style={styles.sessionsContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color="#2196F3"
            />
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

  const handleStartMatching = (filters: FilterOptions) => {
    // Map filter options to the format expected by the backend
    const userGender = user?.gender || 'male';  // Default to male if not set
    const partnerGender = filters.gender === 'any' ? 'any' : filters.gender;
    const languageProficiency = filters.englishLevel === 'any' ? 'any' : filters.englishLevel;
    
    
    router.push({
      pathname: '/match-making',
      params: {
        userGender,
        partnerGender,
        languageProficiency
      }
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
                onPress={() => router.push("/(protected)/(tabs)/ai-characters")}
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
                  {onlineUsers.length ? onlineUsers.length - 1 === 1 ? '1 user' : onlineUsers.length - 1 > 1 ? `${onlineUsers.length - 1} users` : 'No users' : 'No users' } online
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
      </ScrollView>
      <FilterDialog
        visible={filterDialogVisible}
        onClose={() => setFilterDialogVisible(false)}
        onApply={handleStartMatching}
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
});

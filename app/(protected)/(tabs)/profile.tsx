import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Use the actual routes
  // const handleViewSavedReports = () => router.push('/saved-reports');
  // const handleViewSessionHistory = () => router.push('/session-history');
  const handleEditProfile = () => router.push('/edit-profile');
  
  const getImageSource = (imagePath: string) => {
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

  const handleViewSavedReports = () => {
    router.push('/saved-reports');
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profile',
          headerTransparent: true,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <View style={styles.profileHeader}>
            <View style={styles.profilePicture}>
           { user?.profileImage ? (<Image 
              source={getImageSource(user.profileImage)} 
              style={styles.avatar} 
            />) : (<IconSymbol size={60} name="person.fill" color="#FFF" />)}
            </View>
            <ThemedText type="title">{user?.name || 'Your Name'}</ThemedText>
            <ThemedText>{user?.email || user?.phoneNumber}</ThemedText>
          </View>
          
          {/* <ThemedView style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText type="subtitle">12</ThemedText>
              <ThemedText>Sessions</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText type="subtitle">4</ThemedText>
              <ThemedText>Hours</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText type="subtitle">350</ThemedText>
              <ThemedText>Coins</ThemedText>
            </View>
          </ThemedView> */}
          
          <ThemedView style={styles.menuContainer}>
             <TouchableOpacity style={styles.menuItem} onPress={handleViewSavedReports}>
              <View style={styles.menuIcon}>
                <IconSymbol size={24} name="doc.text.fill" color="#4A86E8" />
              </View>
              <View style={styles.menuContent}>
                <ThemedText style={styles.menuTitle}>Saved Reports</ThemedText>
                <ThemedText style={styles.menuDescription}>View your saved session reports</ThemedText>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#888" />
            </TouchableOpacity>
            {/*
            <TouchableOpacity style={styles.menuItem} onPress={handleViewSessionHistory}>
              <View style={styles.menuIcon}>
                <IconSymbol size={24} name="clock.fill" color="#4A86E8" />
              </View>
              <View style={styles.menuContent}>
                <ThemedText style={styles.menuTitle}>Session History</ThemedText>
                <ThemedText style={styles.menuDescription}>See your past practice sessions</ThemedText>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#888" />
            </TouchableOpacity>
             */}
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={styles.menuIcon}>
                <IconSymbol size={24} name="pencil" color="#4A86E8" />
              </View>
              <View style={styles.menuContent}>
                <ThemedText style={styles.menuTitle}>Edit Profile</ThemedText>
                <ThemedText style={styles.menuDescription}>Update your profile information</ThemedText>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
              <View style={styles.menuIcon}>
                <IconSymbol size={24} name="gear" color="#4A86E8" />
              </View>
              <View style={styles.menuContent}>
                <ThemedText style={styles.menuTitle}>Settings</ThemedText>
                <ThemedText style={styles.menuDescription}>Update settings</ThemedText>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/referral')}>
              <View style={styles.menuIcon}>
                <IconSymbol size={24} name="gift.fill" color="#4A86E8" />
              </View>
              <View style={styles.menuContent}>
                <ThemedText style={styles.menuTitle}>Invite Friends</ThemedText>
                <ThemedText style={styles.menuDescription}>Refer friends and earn rewards</ThemedText>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#888" />
            </TouchableOpacity>
          </ThemedView>
          
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <IconSymbol size={20} name="arrow.right.square" color="#FFFFFF" />
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 32,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A86E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  menuContainer: {
    gap: 16,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  menuTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: '#888',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '500',
  },
}); 
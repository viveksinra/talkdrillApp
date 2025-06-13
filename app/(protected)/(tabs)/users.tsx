import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersList } from '@/api/services/userService';
import streamService from '@/api/services/streamService';
import { FilterDialog, FilterOptions } from '@/components/FilterDialog';

interface User {
  id: string;
  name: string;
  profileImage?: string;
  isOnline: boolean;
}

export default function OnlineUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    gender: 'any',
    englishLevel: 'any',
    accent: 'indian'
  });
  
  const fetchUsers = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await getUsersList();
      
      // Only update if not aborted
      if (!signal?.aborted) {
        const usersWithOnlineStatus = response.users
          .filter((u: any) => u._id !== user?.id) // Filter first
          .map((u: any) => ({
            ...u,
            isOnline: onlineUsers.includes(u._id)
          }));
        
        setUsers(usersWithOnlineStatus);
      }
    } catch (error) {
      if (!signal?.aborted) {
        console.error('Error loading users:', error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleApplyFilters = async (filters: FilterOptions) => {
    setActiveFilters(filters);
    fetchUsersWithFilters(filters);
  };

  const fetchUsersWithFilters = async (filters: FilterOptions) => {
    try {
      setLoading(true);
      const response = await getUsersList();
      
      let filteredUsers = response.users
        .filter((u: any) => u._id !== user?.id);
      
      if (filters.gender !== 'any') {
        filteredUsers = filteredUsers.filter((u: any) => 
          u.gender === filters.gender
        );
      }
      
      if (filters.englishLevel !== 'any') {
        filteredUsers = filteredUsers.filter((u: any) => 
          u.languageProficiency === filters.englishLevel
        );
      }
      
      const usersWithOnlineStatus = filteredUsers.map((u: any) => ({
        ...u,
        isOnline: onlineUsers.includes(u._id)
      }));
      
      setUsers(usersWithOnlineStatus);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    const abortController = new AbortController();
    fetchUsers(abortController.signal);
    return () => abortController.abort();
  }, []); 

  // Update online status without re-fetching
  useEffect(() => {
    if (users.length > 0 && onlineUsers) {
      setUsers(prevUsers => 
        prevUsers.map(u => ({
          ...u,
          isOnline: onlineUsers.includes(u.id)
        }))
      );
    }
  }, [onlineUsers]);

  const handleChatWithUser = (user: User) => {
    router.push({
      pathname: '/peer-chat',
      params: {
        peerId: user.id,
        peerName: user.name,
        peerAvatar: user.profileImage
      }
    });
  };
  
  const handleCallUser = async (recipientUser: User) => {
    try {
      // Initialize the client with user profile info first
      await streamService.ensureInitialized(
        user?.id || '', 
        user?.name,
        user?.profileImage
      );
      
      // Call the user with default 30 minutes duration
      const DEFAULT_DURATION = 30; // minutes
      const { callId, streamCallId, durationInMinutes } = await streamService.callUser(
        recipientUser.id, 
        recipientUser.name,
        DEFAULT_DURATION
      );
      
      // Now navigate to call screen with duration parameter
      router.push({
        pathname: '/peer-call',
        params: {
          peerId: recipientUser.id,
          peerName: recipientUser.name,
          callId: callId,
          streamCallId: streamCallId,
          durationInMinutes: durationInMinutes.toString(), // Add duration parameter
          isIncoming: 'false'
        }
      });
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Error', 'Could not start call. Please try again.');
    }
  };

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
  
  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.profileImage ? (
            <Image 
              source={getImageSource(item.profileImage)} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <ThemedText style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}
          <View style={[
            styles.onlineIndicator, 
            item.isOnline ? styles.online : styles.offline
          ]} />
        </View>
        <View style={{flexDirection: 'column'}}>
          <ThemedText style={styles.userName}>{item.name.length > 20 ? item.name.slice(0, 20) + '...' : item.name}</ThemedText>
          <ThemedText style={styles.userStatus}>
            {item.isOnline ? 'Online' : 'Offline'}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton]}
          onPress={() => handleChatWithUser(item)}
        >
          <Ionicons name="chatbubble" size={20} color="#4A86E8" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, !item.isOnline && styles.disabledButton]}
          onPress={() => handleCallUser(item)}
          disabled={!item.isOnline}
        >
          <Ionicons name="call" size={20} color="#4CD964" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <ThemedView style={styles.container}>
        <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Peers</ThemedText>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity onPress={() => setFilterDialogVisible(true)} style={{marginRight: 16}}>
            <Ionicons name="filter" size={24} color="#4A86E8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fetchUsers()}>
            <Ionicons name="refresh" size={24} color="#4A86E8" />
          </TouchableOpacity>
        </View>
      </View>
      <ThemedView style={styles.container}>
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={() => fetchUsers()}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No users found
              </ThemedText>
            </View>
          )}
        />
      </ThemedView>
      <FilterDialog
        visible={filterDialogVisible}
        onClose={() => setFilterDialogVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
        headerTitle="Filter Users"
        headerSubtitle="Find users that match your preferences"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A86E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  online: {
    backgroundColor: '#4CD964',
  },
  offline: {
    backgroundColor: '#8E8E93',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userStatus: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
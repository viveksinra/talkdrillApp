import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersList } from '@/api/services/userService';

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
    console.log('Chatting with user:', user);
    router.push({
      pathname: '/peer-chat',
      params: {
        peerId: user.id,
        peerName: user.name,
        peerAvatar: user.profileImage
      }
    });
  };
  
  const handleCallUser = (user: User) => {
    router.push({
      pathname: '/peer-call',
      params: {
        peerId: user.id,
        peerName: user.name
      }
    });
  };
  
  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.profileImage ? (
            <Image 
              source={{ uri: item.profileImage }} 
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
        <ThemedText style={styles.userName}>{item.name}</ThemedText>
        <ThemedText style={styles.userStatus}>
          {item.isOnline ? 'Online' : 'Offline'}
        </ThemedText>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, !item.isOnline && styles.disabledButton]}
          onPress={() => handleChatWithUser(item)}
          disabled={!item.isOnline}
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
    <>
      <Stack.Screen
        options={{
          headerBackTitle: 'Back',
          title: 'Online Users',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#4A86E8" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => fetchUsers()}>
              <Ionicons name="refresh" size={24} color="#4A86E8" />
            </TouchableOpacity>
          ),
        }}
      />
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginLeft: 8,
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
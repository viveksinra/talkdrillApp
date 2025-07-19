import { createContext, useState, useContext, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { getCurrentUser } from '@/api/services/private/userService';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  gender?: string;
  languageProficiency?: string;
  isAccountSetupCompleted?: boolean;
  motherTongue?: string;
  learningMotivation?: string;
  interests?: string[];
  focusAreas?: string[];
  level: 'basic' | 'pro' | 'advanced';
  dailyStreak: number;
  coins?: number;
  referralCode?: string;
  settings?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Only load the stored user data on initial mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');
        
        if (storedToken && storedUser) {
          console.log("storedUser", JSON.parse(storedUser));
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (token: string, userData: User) => {
    try {
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Error removing auth data:', error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await getCurrentUser();
      if (response && response.id) {
        const updatedUser = {
          id: response.id,
          name: response.name,
          email: response.email,
          phoneNumber: response.phoneNumber,
          profileImage: response.profileImage,
          coins: response.coins,
          dailyStreak: response.dailyStreak,
          level: response.level,
          settings: response.settings,
          referralCode: response.referralCode,
          // Keep existing local properties that might not be in server response
          ...user,
          // Override with server data
          ...response
        };
        
        setUser(updatedUser);
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        console.log('User data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A86E8" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: loading,
        login,
        logout,
        updateUser,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
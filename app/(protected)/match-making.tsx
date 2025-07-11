import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, TouchableOpacity, Alert, Platform, Animated } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import socketService from '@/api/services/socketService';
import streamService from '@/api/services/streamService';
import { post } from '@/api/config/axiosConfig';

enum MatchingStatus {
  INITIALIZING = 'initializing',
  SEARCHING = 'searching',
  FOUND = 'found',
  TIMED_OUT = 'timedOut',
  ERROR = 'error'
}

// Define interface for match info
interface MatchInfo {
  callId: string;
  streamCallId: string;
  partnerId: string;
  partnerName?: string;
  partnerImage?: string;
  token?: string;
  connectingIn?: number;
  [key: string]: any; // Allow additional properties
}

// Add CircularProgress component for match-making
const CircularProgress = ({ size = 200 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.circularProgressBorder,
          { 
            width: size, 
            height: size, 
            transform: [{ rotate: spin }] 
          }
        ]}
      />
      <View style={styles.searchIcon}>
        <Ionicons name="search" size={40} color={Colors.light.primary} />
      </View>
    </View>
  );
};

export default function MatchMakingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userGender, partnerGender, languageProficiency, coinCostPer5Min } = useLocalSearchParams<{
    userGender: string;
    partnerGender: string;
    languageProficiency: string;
    coinCostPer5Min: string; // Add coin cost parameter
  }>();
  
  const [status, setStatus] = useState<MatchingStatus>(MatchingStatus.INITIALIZING);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Create ref for cleanup of error handlers
  const errorHandlerCleanupRef = useRef<(() => void) | null>(null);
  
  // Cleanup function for timers
  const clearTimers = () => {
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  };
  
  // Start searching effect
  useEffect(() => {
    const ensureSocketConnection = async () => {
      return new Promise<void>((resolve, reject) => {
        try {
          if (!user?.id) {
            console.error('No user ID available for socket connection');
            reject(new Error('No user ID available'));
            return;
          }
          
          console.log('Attempting to connect socket for user:', user.id);
          
          // Connect socket
          const socket = socketService.connect(user.id);
          
          // Register user as online
          socketService.sendUserOnline(user.id);
          
          // Listen for online confirmation from server
          const handleOnlineConfirmation = (data: any) => {
            console.log('Online status confirmed by server:', data);
            if (data.userId === user.id) {
              socketService.off('online_status_confirmed', handleOnlineConfirmation);
              resolve();
            }
          };
          
          // Listen for connection event to ensure we're properly connected
          const handleConnect = (data: any) => {
            console.log('Socket connected event triggered with data:', data);
            socketService.sendUserOnline(user.id); // Send again to be sure
          };
          
          const handleError = (error: any) => {
            console.error('Socket connection error:', error);
            reject(error);
          };
          
          socketService.on('online_status_confirmed', handleOnlineConfirmation);
          socketService.on('connect', handleConnect);
          socketService.on('connect_error', handleError);
          
          // If socket is already connected, still wait for online confirmation
          if (socket && socket.connected) {
            console.log('Socket was already connected, registering user as online');
            socketService.sendUserOnline(user.id);
          }
          
          // Set a timeout just in case
          setTimeout(() => {
            socketService.off('online_status_confirmed', handleOnlineConfirmation);
            socketService.off('connect', handleConnect);
            socketService.off('connect_error', handleError);
            console.log('Socket connection or online confirmation timeout, proceeding anyway');
            resolve(); // Resolve anyway and try to continue
          }, 8000);
        } catch (error) {
          console.error('Unhandled error during socket connection setup:', error);
          reject(error);
        }
      });
    };
    
    const initializeSearch = async () => {
      try {
        setStatus(MatchingStatus.INITIALIZING);
        
        // Set up error handling that works in React Native
        // This is platform-specific and doesn't rely on window
        if (Platform.OS === 'web') {
          // Web platform - use window
          const errorHandler = (event: PromiseRejectionEvent) => {
            console.error('Unhandled promise rejection in match-making:', event.reason);
            if (status !== MatchingStatus.ERROR && status !== MatchingStatus.FOUND && status !== MatchingStatus.TIMED_OUT) {
              setStatus(MatchingStatus.ERROR);
              setErrorMessage('An unexpected error occurred. Please try again.');
            }
            event.preventDefault();
          };
          
          window.addEventListener('unhandledrejection', errorHandler);
          errorHandlerCleanupRef.current = () => {
            window.removeEventListener('unhandledrejection', errorHandler);
          };
        } else {
          // For React Native, we'll use a simpler approach since ErrorUtils
          // requires additional type declarations
          // We'll rely on try-catch blocks throughout the code instead
          console.log('Using native error handling approach with try-catch blocks');
          // No special error handler setup needed
        }
        
        // Validate parameters
        if (!user?.id) {
          console.error('No user ID available');
          setStatus(MatchingStatus.ERROR);
          setErrorMessage('User ID is missing. Please log in again.');
          return;
        }
        
        // Make sure we have valid gender values
        const validUserGender = userGender === 'male' || userGender === 'female' ? userGender : user.gender || 'male';
        const validPartnerGender = partnerGender === 'male' || partnerGender === 'female' || partnerGender === 'any' ? partnerGender : 'any';
        
        // Make sure we have valid language proficiency
        const validLanguageProficiency = ['beginner', 'intermediate', 'advanced'].includes(languageProficiency as string) 
          ? languageProficiency 
          : 'beginner';
        
        console.log('Validated parameters:', {
          userGender: validUserGender,
          partnerGender: validPartnerGender,
          languageProficiency: validLanguageProficiency
        });
        
        // Ensure socket is connected before proceeding
        try {
          await ensureSocketConnection();
        } catch (socketError) {
          console.warn('Socket connection issue, but proceeding with API call:', socketError);
        }
        
        // Verify authentication token exists
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          console.error('No authentication token found');
          setStatus(MatchingStatus.ERROR);
          setErrorMessage('Authentication token missing. Please log in again.');
          return;
        }
        
        console.log('Authentication token verified:', token.substring(0, 15) + '...');
        
        // Set up socket listeners
        socketService.on('search_started', handleSearchStarted);
        socketService.on('match_found', handleMatchFound);
        socketService.on('search_timeout', handleSearchTimeout);
        socketService.on('search_error', handleSearchError);
        
        // Start search timer
        searchTimerRef.current = setInterval(() => {
          setSearchTime(prev => prev + 1);
        }, 1000);
        
        // Prepare parameters for API call
        const apiParams = {
          userGender: validUserGender,
          partnerGender: validPartnerGender,
          languageProficiency: validLanguageProficiency
        };
        
        console.log('Sending match request with params:', apiParams);
        
        // Send API request to start matching with longer timeout
        try {
          console.log(`Making API call to /api/v1/call/match with params:`, apiParams);
          
          const response = await post('/api/v1/call/match', apiParams, {
            timeout: 30000 // 30 seconds timeout for this request
          });
          
          console.log('Match API response:', response.data);
          
          if (!response.data) {
            throw new Error('Empty response from server');
          }
          
          // Check for error message in response
          if (response.data.variant === 'error') {
            throw new Error(response.data.message || 'Unknown error from server');
          }
          
          if (response.data.myData?.callId) {
            // Match found immediately via API
            console.log('Match found immediately:', response.data.myData);
            handleMatchFound(response.data.myData);
          } else {
            // Set timeout from server response
            console.log('Search started, waiting for match');
            setStatus(MatchingStatus.SEARCHING);
            
            // Set timeout timer
            const timeout = response.data.myData?.timeout || 6000; // 1 minutes default
            console.log(`Setting timeout timer for ${timeout}ms`);
            timeoutTimerRef.current = setTimeout(() => {
              console.log('Local timeout triggered, calling handleSearchTimeout');
              handleSearchTimeout({ userId: user?.id });
            }, timeout);
          }
        } catch (apiError: any) {
          console.error('API call error:', apiError);
          
          // Log detailed error information
          if (apiError.response) {
            console.log('API error response:', apiError.response.data);
            console.log('API error status:', apiError.response.status);
          }
          
          console.log('API error message:', apiError.message);
          
          // Extract the most useful error message
          let errorMessage = 'Failed to start search. Please try again.';
          
          if (apiError.response?.data?.message) {
            errorMessage = apiError.response.data.message;
          } else if (apiError.response?.data?.error) {
            errorMessage = apiError.response.data.error;
          } else if (apiError.message) {
            errorMessage = apiError.message;
          }
          
          // Check if it's an active call error
          if (errorMessage.includes('already in an active call')) {
            // Show alert with option to end current call
            Alert.alert(
              'Active Call Detected',
              'You are already in an active call. Would you like to end it and start a new search?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => router.back()
                },
                {
                  text: 'End Current Call',
                  style: 'destructive',
                  onPress: () => endCurrentCallAndSearch()
                }
              ]
            );
          } else {
            // For other errors, just show the error message
            setStatus(MatchingStatus.ERROR);
            setErrorMessage(errorMessage);
          }
          return; // Don't re-throw, we've handled it here
        }
      } catch (error: any) {
        console.log('Full error object:', error);
        console.error('Error starting match search:', error);
        setStatus(MatchingStatus.ERROR);
        
        // Better error extraction from axios response
        const errorMessage = 
          error.response?.data?.message || // Standard message format
          error.response?.data?.error ||   // Alternative error format
          error.message ||                // Error object message
          'Failed to start search. Please try again.'; // Fallback
          
        console.log('Error message extracted:', errorMessage);
        setErrorMessage(errorMessage);
      }
    };
    
    initializeSearch();
    
    // Cleanup on component unmount
    return () => {
      clearTimers();
      
      // Clean up error handler if set
      if (errorHandlerCleanupRef.current) {
        errorHandlerCleanupRef.current();
      }
      
      // Cancel search if still active
      if (status === MatchingStatus.SEARCHING && user?.id) {
        try {
          socketService.emit('cancel_matching', { userId: user.id });
        } catch (error) {
          console.error('Error canceling match on unmount:', error);
        }
      }
      
      // Remove socket listeners
      try {
        socketService.off('search_started', handleSearchStarted);
        socketService.off('match_found', handleMatchFound);
        socketService.off('search_timeout', handleSearchTimeout);
        socketService.off('search_error', handleSearchError);
      } catch (error) {
        console.error('Error removing socket listeners on unmount:', error);
      }
    };
  }, []);
  
  // Socket event handlers
  const handleSearchStarted = (data: any) => {
    try {
      console.log('Search started:', data);
      setStatus(MatchingStatus.SEARCHING);
    } catch (error) {
      console.error('Error in handleSearchStarted:', error);
      setStatus(MatchingStatus.ERROR);
      setErrorMessage('Error starting search. Please try again.');
    }
  };
  
  const handleMatchFound = async (data: any) => {
    try {
      console.log('Match found:', data);
      setStatus(MatchingStatus.FOUND);
      setMatchInfo(data);
      clearTimers();
      
      // Verify we have all required data
      if (!data.callId || !data.streamCallId || !data.partnerId) {
        console.error('Match data incomplete:', data);
        setStatus(MatchingStatus.ERROR);
        setErrorMessage('Match data incomplete. Please try again.');
        return;
      }
      
      // Wait a moment to allow both users to see the match info
      const waitTime = 3000;
      console.log(`Waiting ${waitTime}ms before auto-joining call...`);
      
      // Update UI first
      setMatchInfo({
        ...data,
        connectingIn: Math.round(waitTime / 1000)
      });
      
      // Wait time with countdown
      const intervalId = setInterval(() => {
        setMatchInfo(prev => {
          if (prev && typeof prev.connectingIn === 'number' && prev.connectingIn > 0) {
            return {
              ...prev,
              connectingIn: prev.connectingIn - 1
            };
          }
          return prev;
        });
      }, 1000);
      
      setTimeout(() => {
        clearInterval(intervalId);
        
        // Emit an event that we're about to join
        socketService.emit('preparing_to_join_call', { 
          userId: user?.id,
          callId: data.callId,
          streamCallId: data.streamCallId
        });
        
        // Navigate to call screen with coin cost
        router.replace({
          pathname: '/peer-call',
          params: {
            peerId: data.partnerId,
            peerName: data.partnerName || 'Partner',
            callId: data.callId,
            streamCallId: data.streamCallId,
            isIncoming: 'false',
            autoJoin: 'true',
            coinCostPer5Min: coinCostPer5Min || '5' // Pass coin cost
          }
        });
      }, waitTime);
    } catch (error) {
      console.error('Error in handleMatchFound:', error);
      setStatus(MatchingStatus.ERROR);
      setErrorMessage('Error finding match. Please try again.');
    }
  };
  
  const handleSearchTimeout = (data: any) => {
    console.log('Search timed out:', data);
    setStatus(MatchingStatus.TIMED_OUT);
    clearTimers();
  };
  
  const handleSearchError = (data: any) => {
    console.log('Search error:', data);
    setStatus(MatchingStatus.ERROR);
    
    // Check if this is an active call error
    if (data.error && data.error.includes('already in an active call')) {
      // Show an alert with option to end current call
      Alert.alert(
        'Active Call Detected',
        'You are already in an active call. Would you like to end it and start a new search?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back()
          },
          {
            text: 'End Current Call',
            style: 'destructive',
            onPress: () => endCurrentCallAndSearch()
          }
        ]
      );
    } else {
      setErrorMessage(data.error || 'An error occurred during search');
    }
  };
  
  // Function to end current call and start new search
  const endCurrentCallAndSearch = async () => {
    try {
      console.log('Attempting to end current call');
      setStatus(MatchingStatus.INITIALIZING);
      setErrorMessage('');
      
      // Use the new API endpoint to end all active calls
      const response = await post('/api/v1/call/end-active-calls', {});
      
      console.log('End active calls response:', response.data);
      
      if (response.data.variant === 'success' || response.data.variant === 'info') {
        console.log('Calls ended successfully or no active calls found');
        
        // Wait a moment and retry search
        setTimeout(() => {
          console.log('Retrying search after ending call');
          handleTryAgain();
        }, 1500);
      } else {
        setStatus(MatchingStatus.ERROR);
        setErrorMessage(response.data.message || 'Failed to end active calls');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      setStatus(MatchingStatus.ERROR);
      setErrorMessage('Failed to end current call. Please try again later.');
    }
  };
  
  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Cancel search
  const handleCancel = () => {
    if (user?.id) {
      socketService.emit('cancel_matching', { userId: user.id });
    }
    router.back();
  };
  
  // Try again
  const handleTryAgain = () => {
    try {
      setStatus(MatchingStatus.INITIALIZING);
      setSearchTime(0);
      setErrorMessage('');
      router.replace({
        pathname: '/match-making',
        params: { userGender, partnerGender, languageProficiency }
      });
    } catch (error) {
      console.error('Error in handleTryAgain:', error);
      // If we can't navigate, just show an alert
      Alert.alert(
        'Error',
        'Could not restart search. Please go back and try again.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    }
  };
  
  // Render based on current status
  const renderContent = () => {
    switch (status) {
      case MatchingStatus.INITIALIZING:
        return (
          <View style={styles.centerContent}>
            <CircularProgress size={150} />
            <ThemedText style={styles.statusText}>Initializing search...</ThemedText>
          </View>
        );
        
      case MatchingStatus.SEARCHING:
        return (
          <View style={styles.centerContent}>
            <View style={styles.heroSection}>
              <ThemedText style={styles.heroTitle}>Finding a practice partner...</ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                We're connecting you with someone who matches your language level. This may take a moment.
              </ThemedText>
            </View>

            <CircularProgress size={200} />
            
            <View style={styles.timerSection}>
              <ThemedText style={styles.timerText}>{formatTime(searchTime)}</ThemedText>
            </View>

            <View style={styles.tipsSection}>
              <ThemedText style={styles.tipsTitle}>While you wait:</ThemedText>
              
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <ThemedText style={styles.tipText}>
                    Prepare a brief introduction about yourself
                  </ThemedText>
                </View>
                
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <ThemedText style={styles.tipText}>
                    Think of 2-3 questions to ask your partner
                  </ThemedText>
                </View>
                
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <ThemedText style={styles.tipText}>
                    Remember to speak clearly and at a moderate pace
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        );
        
      case MatchingStatus.FOUND:
        return (
          <View style={styles.centerContent}>
            <View style={styles.matchFoundSection}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              <ThemedText style={styles.successTitle}>Match Found!</ThemedText>
              <ThemedText style={styles.successSubtitle}>
                Connecting with {matchInfo?.partnerName || 'partner'}.
              </ThemedText>
              
              {/* {matchInfo?.connectingIn !== undefined && (
                <View style={styles.countdownSection}>
                  <ThemedText style={styles.countdownText}>
                    Call starting in {matchInfo.connectingIn} seconds
                  </ThemedText>
                </View>
              )} */}
            </View>
          </View>
        );
        
      case MatchingStatus.TIMED_OUT:
        return (
          <View style={styles.centerContent}>
            <View style={styles.errorSection}>
              <Ionicons name="time-outline" size={80} color="#FF9800" />
              <ThemedText style={styles.errorTitle}>Search Timed Out</ThemedText>
              <ThemedText style={styles.errorSubtitle}>
                We couldn't find a matching partner. Please try again with different filters.
              </ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={handleTryAgain}>
                <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      case MatchingStatus.ERROR:
        return (
          <View style={styles.centerContent}>
            <View style={styles.errorSection}>
              <Ionicons name="alert-circle" size={80} color="#F44336" />
              <ThemedText style={styles.errorTitle}>Connection Error</ThemedText>
              <ThemedText style={styles.errorSubtitle}>{errorMessage}</ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={handleTryAgain}>
                <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "Peer Practice",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleCancel} 
              style={styles.headerLeftButton}
            >
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
          ),
          headerTitleAlign: 'center',
        }}
      />
      <ThemedView style={styles.container}>
        {renderContent()}
        
        {status === MatchingStatus.SEARCHING && (
          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <ThemedText style={styles.cancelButtonText}>Cancel Search</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A1D96', // Purple gradient background start
  },
  centerContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  circularProgressContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  circularProgressBorder: {
    borderWidth: 3,
    borderRadius: 999,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    position: 'absolute',
  },
  searchIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  tipsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  matchFoundSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  countdownSection: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countdownText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  errorSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  headerLeftButton: {
    paddingHorizontal: 16,
    marginLeft: 4,
  },
  bottomSection: {
    alignItems: 'center',
    padding: 20,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
});

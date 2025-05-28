import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, TouchableOpacity, Alert, Platform } from 'react-native';
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

export default function MatchMakingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userGender, partnerGender, languageProficiency } = useLocalSearchParams<{
    userGender: string;
    partnerGender: string;
    languageProficiency: string;
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
      // This helps synchronize both users joining close to the same time
      const waitTime = 3000; // Increased from 2000ms to 3000ms
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
      
      // Use a longer timeout before redirecting
      setTimeout(() => {
        clearInterval(intervalId);
        
        // Emit an event that we're about to join
        socketService.emit('preparing_to_join_call', { 
          userId: user?.id,
          callId: data.callId,
          streamCallId: data.streamCallId
        });
        
        // Navigate to call screen
        router.replace({
          pathname: '/peer-call',
          params: {
            peerId: data.partnerId,
            peerName: data.partnerName || 'Partner',
            callId: data.callId,
            streamCallId: data.streamCallId,
            isIncoming: 'false',
            autoJoin: 'true'
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
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={styles.statusText}>Initializing search...</ThemedText>
          </View>
        );
        
      case MatchingStatus.SEARCHING:
        return (
          <View style={styles.centerContent}>
            <View style={styles.searchingAnimation}>
              <View style={styles.loaderContainer}>
                <ActivityIndicator 
                  size="large" 
                  color={Colors.light.primary} 
                  style={styles.searchingIndicator} 
                />
              </View>
              <View style={styles.iconContainer}>
                <Ionicons name="people" size={40} color={Colors.light.primary} />
              </View>
            </View>
            <ThemedText style={styles.statusText}>Searching for a partner...</ThemedText>
            <ThemedText style={styles.timerText}>{formatTime(searchTime)}</ThemedText>
            <View style={styles.filterInfo}>
              <ThemedText style={styles.filterText}>Searching for: {partnerGender} partner</ThemedText>
              <ThemedText style={styles.filterText}>Proficiency: {languageProficiency}</ThemedText>
            </View>
          </View>
        );
        
      case MatchingStatus.FOUND:
        return (
          <View style={styles.centerContent}>
            <View style={styles.matchFoundAnimation}>
              <Ionicons name="checkmark-circle" size={60} color="green" />
            </View>
            <ThemedText style={styles.successText}>Match Found!</ThemedText>
            <ThemedText style={styles.matchInfoText}>
              Connecting with {matchInfo?.partnerName || 'partner'}...
            </ThemedText>
            {matchInfo?.connectingIn !== undefined && (
              <ThemedText style={styles.autoConnectText}>
                Call starting in {matchInfo.connectingIn} seconds
              </ThemedText>
            )}
          </View>
        );
        
      case MatchingStatus.TIMED_OUT:
        return (
          <View style={styles.centerContent}>
            <Ionicons name="time-outline" size={60} color="#F57C00" />
            <ThemedText style={styles.timeoutText}>Search Timed Out</ThemedText>
            <ThemedText style={styles.timeoutInfoText}>
              We couldn't find a matching partner. Please try again with different filters.
            </ThemedText>
            <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
              <ThemedText style={styles.tryAgainText}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        );
        
      case MatchingStatus.ERROR:
        return (
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle" size={60} color="red" />
            <ThemedText style={styles.errorText}>Error</ThemedText>
            <ThemedText style={styles.errorInfoText}>{errorMessage}</ThemedText>
            <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
              <ThemedText style={styles.tryAgainText}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        );
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "Finding Partner",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleCancel} 
              style={styles.headerLeftButton}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          ),
          headerTitleAlign: 'center',
        }}
      />
      <ThemedView style={styles.container}>
        {renderContent()}
        
        {status === MatchingStatus.SEARCHING && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={styles.cancelText}>Cancel Search</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    color: Colors.light.primary,
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 40,
  },
  searchingAnimation: {
    position: 'relative',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  loaderContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  searchingIndicator: {
    width: 200,
    height: 200,
  },
  headerLeftButton: {
    paddingHorizontal: 16,
    marginLeft: 4,
  },
  filterInfo: {
    marginTop: 20,
    backgroundColor: '#F0F4FF',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  filterText: {
    fontSize: 16,
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 40,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  matchFoundAnimation: {
    marginBottom: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 16,
  },
  matchInfoText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  autoConnectText: {
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  timeoutText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F57C00',
    marginTop: 16,
    marginBottom: 16,
  },
  timeoutInfoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: Colors.light.secondary,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'red',
    marginTop: 16,
    marginBottom: 16,
  },
  errorInfoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: Colors.light.secondary,
  },
  tryAgainButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  tryAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
});

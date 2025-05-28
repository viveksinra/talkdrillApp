import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

export default function MatchMakingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userGender, partnerGender, languageProficiency } = useLocalSearchParams<{
    userGender: string;
    partnerGender: string;
    languageProficiency: string;
  }>();
  
  const [status, setStatus] = useState<MatchingStatus>(MatchingStatus.INITIALIZING);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    const initializeSearch = async () => {
      try {
        // Make sure socket is connected
        socketService.connect(user?.id || '');
        
        // Set up socket listeners
        socketService.on('search_started', handleSearchStarted);
        socketService.on('match_found', handleMatchFound);
        socketService.on('search_timeout', handleSearchTimeout);
        socketService.on('search_error', handleSearchError);
        
        // Start search timer
        searchTimerRef.current = setInterval(() => {
          setSearchTime(prev => prev + 1);
        }, 1000);
        
        // Send API request to start matching
        const response = await post('/api/v1/call/match', {
          userGender,
          partnerGender, 
          languageProficiency
        });
        
        if (response.data.myData?.callId) {
          // Match found immediately via API
          handleMatchFound(response.data.myData);
        } else {
          // Set timeout from server response
          setStatus(MatchingStatus.SEARCHING);
          
          // Set timeout timer
          const timeout = response.data.myData?.timeout || 120000; // 2 minutes default
          timeoutTimerRef.current = setTimeout(() => {
            handleSearchTimeout({ userId: user?.id });
          }, timeout);
        }
      } catch (error: any) {
        console.error('Error starting match search:', error);
        setStatus(MatchingStatus.ERROR);
        setErrorMessage(error.response?.data?.message || 'Failed to start search. Please try again.');
      }
    };
    
    initializeSearch();
    
    // Cleanup on component unmount
    return () => {
      clearTimers();
      
      // Cancel search if still active
      if (status === MatchingStatus.SEARCHING && user?.id) {
        socketService.emit('cancel_matching', { userId: user.id });
      }
      
      // Remove socket listeners
      socketService.off('search_started', handleSearchStarted);
      socketService.off('match_found', handleMatchFound);
      socketService.off('search_timeout', handleSearchTimeout);
      socketService.off('search_error', handleSearchError);
    };
  }, []);
  
  // Socket event handlers
  const handleSearchStarted = (data: any) => {
    console.log('Search started:', data);
    setStatus(MatchingStatus.SEARCHING);
  };
  
  const handleMatchFound = async (data: any) => {
    console.log('Match found:', data);
    setStatus(MatchingStatus.FOUND);
    setMatchInfo(data);
    clearTimers();
    
    // Auto-connect to call after a short delay
    setTimeout(() => {
      router.replace({
        pathname: '/peer-call',
        params: {
          peerId: data.partnerId,
          peerName: data.partnerName,
          callId: data.callId,
          streamCallId: data.streamCallId,
          isIncoming: 'false',
          autoJoin: 'true'
        }
      });
    }, 2000); // Give user 2 seconds to see the match
  };
  
  const handleSearchTimeout = (data: any) => {
    console.log('Search timed out:', data);
    setStatus(MatchingStatus.TIMED_OUT);
    clearTimers();
  };
  
  const handleSearchError = (data: any) => {
    console.log('Search error:', data);
    setStatus(MatchingStatus.ERROR);
    setErrorMessage(data.error || 'An error occurred during search');
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
    setStatus(MatchingStatus.INITIALIZING);
    setSearchTime(0);
    setErrorMessage('');
    router.replace({
      pathname: '/match-making',
      params: { userGender, partnerGender, languageProficiency }
    });
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
              <Ionicons name="people" size={40} color={Colors.light.primary} />
              <ActivityIndicator size="large" color={Colors.light.primary} style={styles.searchingIndicator} />
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
            <ThemedText style={styles.autoConnectText}>
              You'll be connected to a video call automatically
            </ThemedText>
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
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          ),
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
    color: Colors.light.primary,
  },
  searchingAnimation: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingIndicator: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  filterInfo: {
    marginTop: 40,
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

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Share, 
  Alert, 
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getReferralInfo, generateReferralMessage } from '@/api/services/private/referralService';
import { Colors } from '@/constants/Colors';

export default function ReferralScreen() {
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReferralInfo();
  }, []);

  const loadReferralInfo = async () => {
    try {
      const response = await getReferralInfo();
      setReferralData(response);
    } catch (error) {
      console.error('Error loading referral info:', error);
      Alert.alert('Error', 'Failed to load referral information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReferralInfo();
  };

  const shareReferralCode = async () => {
    if (!referralData?.referralCode) return;
    
    const message = generateReferralMessage(referralData.referralCode);
    
    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyReferralCode = async () => {
    if (!referralData?.referralCode) return;
    
    await Clipboard.setStringAsync(referralData.referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Invite Friends' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading referral info...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Invite Friends' }} />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Invite Friends & Earn</ThemedText>
          <ThemedText style={styles.subtitle}>
            Share TalkDrill with friends and both of you get rewarded!
          </ThemedText>
        </View>

        {/* Referral Code Card */}
        <View style={styles.referralCard}>
          <View style={styles.codeHeader}>
            <IconSymbol name="gift.fill" size={24} color={Colors.light.primary} />
            <ThemedText style={styles.cardTitle}>Your Referral Code</ThemedText>
          </View>
          
          <View style={styles.codeContainer}>
            <ThemedText style={styles.referralCode}>{referralData?.referralCode}</ThemedText>
            <TouchableOpacity onPress={copyReferralCode} style={styles.copyButton}>
              <IconSymbol name="doc.on.doc" size={20} color={Colors.light.primary} />
              <ThemedText style={styles.copyText}>Copy</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.howItWorksCard}>
          <ThemedText style={styles.cardTitle}>How it Works</ThemedText>
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>1</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>Share your unique referral code</ThemedText>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>2</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>Friend signs up with your code</ThemedText>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>3</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>Both of you get 150 bonus coins!</ThemedText>
            </View>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity onPress={shareReferralCode} style={styles.shareButton}>
          <IconSymbol name="square.and.arrow.up" size={20} color="white" />
          <ThemedText style={styles.shareButtonText}>Share Referral Code</ThemedText>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsCard}>
          <ThemedText style={styles.cardTitle}>Your Referral Stats</ThemedText>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {referralData?.referralStats?.totalReferred || 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Friends Referred</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {referralData?.referralStats?.totalReferralRewards || 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Coins Earned</ThemedText>
            </View>
          </View>
        </View>

        {/* Referred Users List */}
        {referralData?.referredUsers && referralData.referredUsers.length > 0 && (
          <View style={styles.referredUsersCard}>
            <ThemedText style={styles.cardTitle}>Friends You've Referred</ThemedText>
            {referralData.referredUsers.map((user: any, index: number) => (
              <View key={index} style={styles.userItem}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>
                      {user.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.userDetails}>
                    <ThemedText style={styles.userName}>{user.name}</ThemedText>
                    <ThemedText style={styles.joinDate}>
                      Joined: {new Date(user.joinedDate).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.rewardBadge, user.rewardClaimed && styles.rewardClaimed]}>
                  <ThemedText style={[styles.rewardText, user.rewardClaimed && styles.rewardClaimedText]}>
                    {user.rewardClaimed ? '150 coins' : 'Pending'}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Referred By Info */}
        {referralData?.referredBy && (
          <View style={styles.referredByCard}>
            <ThemedText style={styles.cardTitle}>You were referred by</ThemedText>
            <View style={styles.referrerInfo}>
              <IconSymbol name="person.fill" size={20} color={Colors.light.primary} />
              <ThemedText style={styles.referrerName}>{referralData.referredBy.name}</ThemedText>
              <ThemedText style={styles.referrerCode}>({referralData.referredBy.referralCode})</ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  referralCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FF',
    padding: 16,
    borderRadius: 12,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  howItWorksCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  stepContainer: {
    marginTop: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  shareButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
  referredUsersCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  joinDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rewardBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardClaimed: {
    backgroundColor: '#D4EDDA',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
  rewardClaimedText: {
    color: '#155724',
  },
  referredByCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  referrerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  referrerName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  referrerCode: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
}); 
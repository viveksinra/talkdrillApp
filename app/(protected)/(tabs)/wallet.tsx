import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Modal
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  getCoinBalance,
  getCoinPackages,
  getComboPackages,
  getSessionLicenseBalance,
  createPaymentOrder,
  verifyPaymentAndAddCoins,
  createComboPaymentOrder,
  verifyComboPaymentAndAddCoins,
  dailyCheckIn,
  type CoinPackage,
  type CoinBalance,
  type DailyCheckInResult,
  type SessionLicenseBalance,
  ComboPackage
} from '@/api/services/coinService';
import { useAuth } from '@/contexts/AuthContext';

export default function CoinsScreen() {
  const router = useRouter();
  const { refreshUserData } = useAuth();
  
  // State
  const [coinBalance, setCoinBalance] = useState<CoinBalance | null>(null);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [sessionLicenseBalance, setSessionLicenseBalance] = useState<SessionLicenseBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [processingCheckIn, setProcessingCheckIn] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [currentPackageId, setCurrentPackageId] = useState<string>('');
  const [coinPackageModal, setCoinPackageModal] = useState(false);
  const [comboPackages, setComboPackages] = useState<ComboPackage[]>([]);

  // Validation functions
  const validateCoinPackage = (pkg: any): boolean => {
    return pkg && 
           typeof pkg.id === 'string' && 
           typeof pkg.coins === 'number' && 
           typeof pkg.price === 'number';
  };

  const validateComboPackage = (pkg: any): boolean => {
    return pkg && 
           typeof pkg.id === 'string' && 
           typeof pkg.name === 'string' && 
           typeof pkg.packageType === 'string';
  };
  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [balance, sessionLicenseBalance, packages, comboPackages] = await Promise.all([
        getCoinBalance(),
        getSessionLicenseBalance(),
        getCoinPackages(),
        getComboPackages(),
        refreshUserData()
      ]);
      
      console.log('Loaded coin packages:', packages);
      console.log('Loaded combo packages:', comboPackages);
      
      setCoinBalance(balance);
      setSessionLicenseBalance(sessionLicenseBalance);
      
      // Validate and set coin packages
      const validCoinPackages = (packages || []).filter(validateCoinPackage);
      setCoinPackages(validCoinPackages);
      
      // Validate and set combo packages
      const validComboPackages = (comboPackages || [])
        .filter(validateComboPackage)
      setComboPackages(validComboPackages);
      
      console.log('Valid coin packages:', validCoinPackages);
      console.log('Valid combo packages:', validComboPackages);
    } catch (error) {
      console.error('Error loading coin data:', error);
      Alert.alert('Error', 'Failed to load coin data. Please try again.');
      // Set empty arrays on error to prevent rendering issues
      setCoinPackages([]);
      setComboPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Handle daily check-in
  const handleDailyCheckIn = async () => {
    if (processingCheckIn) return;
    
    setProcessingCheckIn(true);
    try {
      const result: DailyCheckInResult = await dailyCheckIn();
      
      if (result.alreadyCheckedIn) {
        Alert.alert('Already Checked In', 'You have already checked in today. Come back tomorrow!');
        setCanCheckIn(false);
      } else {
        // Enhanced success message with milestone info
        let message = `You earned ${result.coinsEarned} coins!`;
        
        if (result.bonusCoins > 0 && result.milestoneReached) {
          message += `\n\n🎉 ${result.milestoneReached}-day milestone achieved!`;
          message += `\n🎁 Bonus: ${result.bonusCoins} coins`;
          message += `\n📈 Level up: ${result.level.toUpperCase()}`;
        }
        
        message += `\n🔥 Current streak: ${result.dailyStreak} days`;
        message += `\n✅ Service used: ${result.serviceUsed}`;

        Alert.alert(
          result.milestoneReached ? '🏆 Milestone Achieved!' : '✅ Daily Check-In Successful!',
          message,
          [{ text: 'Awesome!', onPress: () => loadData() }]
        );
      }
    } catch (error: any) {
      // Handle new service usage error
      if (error.message?.includes('use any of the services')) {
        Alert.alert(
          'Service Usage Required', 
          'Please use AI Call, Professional Call, or Peer Practice first to claim your daily check-in.',
          [{ text: 'Got it!' }]
        );
      } else if (error.message?.includes('Already checked in today')) {
        Alert.alert('Already Checked In', 'You have already checked in today. Come back tomorrow!');
        setCanCheckIn(false);
      } else {
        Alert.alert('Error', 'Failed to process daily check-in. Please try again.');
      }
    } finally {
      setProcessingCheckIn(false);
    }
  };

  // Generate Razorpay HTML
  const generateRazorpayHTML = (paymentOrder: any, packageItem: CoinPackage) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            }
            .loading {
                margin: 20px 0;
            }
            button {
                background-color: #F5A623;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px;
            }
            button:hover {
                background-color: #e8941f;
            }
            .cancel-btn {
                background-color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Complete Your Payment</h2>
            <p>Package: ${packageItem.coins} Coins</p>
            <p>Amount: ₹${(paymentOrder.amount / 100).toFixed(2)}</p>
            <div class="loading">
                <p>Click the button below to proceed with payment</p>
            </div>
            <button onclick="startPayment()">Pay Now</button>
            <button class="cancel-btn" onclick="cancelPayment()">Cancel</button>
        </div>

        <script>
            function startPayment() {
                var options = {
                    key: "${paymentOrder.razorpayKeyId}",
                    amount: ${paymentOrder.amount},
                    currency: "${paymentOrder.currency}",
                    name: "TalkDrill",
                    description: "Purchase ${packageItem.coins} coins",
                    order_id: "${paymentOrder.orderId}",
                    theme: {
                        color: "#F5A623"
                    },
                    prefill: {
                        name: "User",
                        email: "user@example.com",
                        contact: "9999999999"
                    },
                    handler: function(response) {
                        // Payment successful
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'PAYMENT_SUCCESS',
                            data: {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                packageId: "${packageItem.id}"
                            }
                        }));
                    },
                    modal: {
                        ondismiss: function() {
                            // Payment cancelled
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'PAYMENT_CANCELLED'
                            }));
                        }
                    }
                };
                
                var rzp = new Razorpay(options);
                rzp.open();
            }
            
            function cancelPayment() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAYMENT_CANCELLED'
                }));
            }
            
            // Auto-start payment after page loads
            setTimeout(startPayment, 1000);
        </script>
    </body>
    </html>
    `;
  };

  // Handle WebView messages
  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'PAYMENT_SUCCESS') {
        setShowPaymentModal(false);
        
        try {
          // Verify payment and add coins
          const result = await verifyPaymentAndAddCoins(message.data);
          
          Alert.alert(
            'Payment Successful!',
            `${result.coinsAdded} coins have been added to your wallet.\n\nNew Balance: ${result.newBalance} coins`,
            [{ text: 'Great!', onPress: () => loadData() }]
          );
        } catch (verifyError) {
          console.error('Payment verification error:', verifyError);
          Alert.alert('Payment Verification Failed', 'Please contact support if coins were not added.');
        }
      } else if (message.type === 'COMBO_PAYMENT_SUCCESS') {
        setShowPaymentModal(false);
        
        try {
          // Verify combo payment and add licenses + coins
          const result = await verifyComboPaymentAndAddCoins(message.data);
          
          Alert.alert(
            'Payment Successful!',
            `${result.sessionLicensesAdded} session licenses and ${result.coinsAdded} coins have been added to your wallet.`,
            [{ text: 'Great!', onPress: () => loadData() }]
          );
        } catch (verifyError) {
          console.error('Combo payment verification error:', verifyError);
          Alert.alert('Payment Verification Failed', 'Please contact support if package was not activated.');
        }
      } else if (message.type === 'PAYMENT_CANCELLED') {
        setShowPaymentModal(false);
        console.log('Payment was cancelled by user');
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    } finally {
      setProcessingPayment(null);
    }
  };

  // Handle coin purchase with WebView
  const handleCoinPurchase = async (packageItem: CoinPackage) => {
    if (processingPayment) return;
    
    console.log('=== Starting coin purchase ===');
    console.log('Package:', packageItem);
    setProcessingPayment(packageItem.id);
    setCurrentPackageId(packageItem.id);
    
    try {
      // Create payment order
      console.log('Creating payment order...');
      const paymentOrder = await createPaymentOrder(packageItem.id);
      console.log('Payment order response:', JSON.stringify(paymentOrder, null, 2));
      
      // Validate payment order response
      if (!paymentOrder?.orderId || !paymentOrder?.razorpayKeyId) {
        console.error('Invalid payment order response:', paymentOrder);
        throw new Error('Invalid payment order response');
      }
      
      // Generate HTML for WebView
      const html = generateRazorpayHTML(paymentOrder, packageItem);
      setPaymentHtml(html);
      setShowPaymentModal(true);
      
    } catch (error) {
      console.error('=== Error in handleCoinPurchase ===');
      console.error('Error details:', error);
      Alert.alert('Error', `Failed to initiate payment: ${(error as Error).message || 'Please try again.'}`);
      setProcessingPayment(null);
    }
  };

  const handleComboPurchase = async (packageItem: ComboPackage) => {
    if (processingPayment) return;
    
    console.log('=== Starting combo purchase ===');
    console.log('Package:', packageItem);
    setProcessingPayment(packageItem.id);
    setCurrentPackageId(packageItem.id);

    try {
      // Create payment order
      console.log('Creating payment order...');
      const paymentOrder = await createComboPaymentOrder(packageItem.id);
      console.log('Payment order response:', JSON.stringify(paymentOrder, null, 2));
      
      // Handle free packages (like trial)
      if (paymentOrder.isFree) {
        // For free packages, directly verify without payment
        const result = await verifyComboPaymentAndAddCoins({
          packageId: packageItem.id,
          razorpay_order_id: 'free_package',
          razorpay_payment_id: 'free_package',
          razorpay_signature: 'free_package'
        });
        
        Alert.alert(
          'Package Activated!',
          `${result.sessionLicensesAdded} session licenses and ${result.coinsAdded} coins have been added to your wallet.`,
          [{ text: 'Great!', onPress: () => loadData() }]
        );
        setProcessingPayment(null);
        return;
      }
      
      // Validate payment order response for paid packages
      if (!paymentOrder?.orderId || !paymentOrder?.razorpayKeyId) {
        console.error('Invalid payment order response:', paymentOrder);
        throw new Error('Invalid payment order response');
      }
      
      // Generate HTML for WebView (modify the existing function to handle combo packages)
      const html = generateComboRazorpayHTML(paymentOrder, packageItem);
      setPaymentHtml(html);
      setShowPaymentModal(true);
      
    } catch (error) {
      console.error('=== Error in handleComboPurchase ===');
      console.error('Error details:', error);
      Alert.alert('Error', `Failed to initiate payment: ${(error as Error).message || 'Please try again.'}`);
      setProcessingPayment(null);
    }
  };

  // Generate Razorpay HTML for combo packages
  const generateComboRazorpayHTML = (paymentOrder: any, packageItem: ComboPackage) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            }
            .loading {
                margin: 20px 0;
            }
            button {
                background-color: #F5A623;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px;
            }
            button:hover {
                background-color: #e8941f;
            }
            .cancel-btn {
                background-color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Complete Your Payment</h2>
            <p>Package: ${packageItem.name}</p>
            <p>Session Licenses: ${packageItem.sessionLicenses}</p>
            <p>Coins: ${packageItem.coins}</p>
            <p>Amount: ${packageItem.priceDisplay}</p>
            <div class="loading">
                <p>Click the button below to proceed with payment</p>
            </div>
            <button onclick="startPayment()">Pay Now</button>
            <button class="cancel-btn" onclick="cancelPayment()">Cancel</button>
        </div>

        <script>
            function startPayment() {
                var options = {
                    key: "${paymentOrder.razorpayKeyId}",
                    amount: ${paymentOrder.amount},
                    currency: "${paymentOrder.currency}",
                    name: "TalkDrill",
                    description: "Purchase ${packageItem.name} combo package",
                    order_id: "${paymentOrder.orderId}",
                    theme: {
                        color: "#F5A623"
                    },
                    prefill: {
                        name: "User",
                        email: "user@example.com",
                        contact: "9999999999"
                    },
                    handler: function(response) {
                        // Payment successful
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'COMBO_PAYMENT_SUCCESS',
                            data: {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                packageId: "${packageItem.id}"
                            }
                        }));
                    },
                    modal: {
                        ondismiss: function() {
                            // Payment cancelled
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'PAYMENT_CANCELLED'
                            }));
                        }
                    }
                };
                
                var rzp = new Razorpay(options);
                rzp.open();
            }
            
            function cancelPayment() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAYMENT_CANCELLED'
                }));
            }
            
            // Auto-start payment after page loads
            setTimeout(startPayment, 1000);
        </script>
    </body>
    </html>
    `;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Wallet',
            headerTitleAlign: 'center',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5A623" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Wallet',
          headerTitleAlign: 'center',
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Section */}
          {/* Balance Sections - Side by Side */}
          <View style={styles.balanceRow}>
            {/* Coins Balance Section */}
            <ThemedView style={[styles.balanceSection, styles.balanceSectionHalf]}>
              <ThemedText type="defaultSemiBold" style={styles.balanceLabel}>
                Your Coins
              </ThemedText>
              <View style={styles.balanceDisplay}>
                <View style={styles.coinIcon}>
                  <IconSymbol size={48} name="bitcoinsign.circle.fill" color="#F5A623" />
                </View>
                <ThemedText type="title" style={styles.balanceAmount}>
                  {String(coinBalance?.coins?.toLocaleString() || '0')}
                </ThemedText>
                <ThemedText style={styles.availableText}>Available Coins</ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.buyCoinsButton}
                onPress={() => {
                  setCoinPackageModal(true);
                  // Navigate to coin packages or show purchase options
                  // This will be implemented based on your coin purchase flow
                }}
              >
                <ThemedText style={styles.buyCoinsButtonText}>
                  Buy Coins
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* Session Licenses Section */}
            <ThemedView style={[styles.balanceSection, styles.balanceSectionHalf]}>
              <ThemedText type="defaultSemiBold" style={styles.balanceLabel}>
                Session Licenses
              </ThemedText>
              <View style={styles.balanceDisplay}>
                <View style={styles.coinIcon}>
                  <IconSymbol size={48} name="video.circle.fill" color="#4A86E8" />
                </View>
                <ThemedText type="title" style={styles.balanceAmount}>
                  {String(sessionLicenseBalance?.sessionLicenses?.toLocaleString() || '0')}
                </ThemedText>
                <ThemedText style={styles.availableText}>Available Sessions</ThemedText>
              </View>
              {/* <TouchableOpacity 
                style={styles.buyCoinsButton}
                onPress={() => {
                  // Navigate to coin packages or show purchase options
                  // This will be implemented based on your coin purchase flow
                }}
              >
                <ThemedText style={styles.buyCoinsButtonText}>
                  Buy Package
                </ThemedText>
              </TouchableOpacity> */}
            </ThemedView>
          </View>

          {/* Daily Check-in Card */}
          <View style={[
            styles.checkInCard,
            !canCheckIn && styles.checkInCardDisabled
          ]}>
            <View style={styles.checkInContent}>
              <View style={styles.checkInHeader}>
                <IconSymbol 
                  size={24} 
                  name="calendar.badge.plus" 
                  color={canCheckIn ? "#4A86E8" : "#999"} 
                />
                <View style={styles.checkInTextContainer}>
                  <ThemedText style={[
                    styles.checkInTitle,
                    !canCheckIn && styles.disabledText
                  ]}>
                    {canCheckIn ? 'Daily Check-in' : 'Already Checked In Today'}
                  </ThemedText>
                  <ThemedText style={[
                    styles.checkInSubtitle,
                    !canCheckIn && styles.disabledText
                  ]}>
                    Earn +10 coins daily
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity 
                style={[
                  styles.claimButton,
                  !canCheckIn && styles.claimButtonDisabled,
                  processingCheckIn && styles.claimButtonProcessing
                ]}
                onPress={handleDailyCheckIn}
                disabled={processingCheckIn || !canCheckIn}
              >
                {processingCheckIn ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <ThemedText style={[
                    styles.claimButtonText,
                    !canCheckIn && styles.claimButtonTextDisabled
                  ]}>
                    {canCheckIn ? 'Claim' : 'Done'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Buy Coins Section */}
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="subtitle">Buy Combo Packages</ThemedText>
          </ThemedView>
          {/* <ScrollView style={styles.packageScrollView} showsVerticalScrollIndicator={false}> */}
            <View style={styles.packageContainer}>
              {comboPackages && comboPackages.length > 0 ? comboPackages.map((packageItem) => (
                <View key={packageItem.id || Math.random().toString()} style={styles.packageCard}>
                  <View style={styles.packageIcon}>
                    <IconSymbol size={24} name="gift.fill" color="#4A86E8" />
                  </View>
                  <View style={styles.packageInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.packageCoins}>
                      {String(packageItem.name || 'Package')} {packageItem.name === 'Expert' && '(Most Popular)'}
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.packagePrice}>
                      {String(packageItem.priceDisplay || 'Price not available')}
                    </ThemedText>
                    <View style={styles.packageInfoRow}>
                      <IconSymbol size={24} name="bitcoinsign.circle.fill" color="#F5A623" />
                      <ThemedText type="subtitle" style={styles.packagePrice}>
                        {String(packageItem.coins || '0')} Coins
                      </ThemedText>
                    </View>
                    <View style={styles.packageInfoRow}>
                      <IconSymbol size={24} name="person.2.fill" color="#4A86E8" />
                      <ThemedText type="subtitle" style={styles.packagePrice}>
                        {String(packageItem.sessionLicenses || '0')} Sessions
                      </ThemedText>
                    </View>
                    {packageItem.bestValue && (
                      <View style={styles.bestValueBadge}>
                        <ThemedText style={styles.bestValueText}>Most Popular</ThemedText>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.buyButton,
                      processingPayment === packageItem.id && styles.buyButtonProcessing
                    ]}
                    onPress={() => handleComboPurchase(packageItem)}
                    disabled={processingPayment !== null}
                  >
                    {processingPayment === packageItem.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              )) : (
                <View style={styles.packageCard}>
                  <ThemedText style={styles.packageCoins}>No combo packages available</ThemedText>
                </View>
              )}
            </View>
          {/* </ScrollView> */}
          {/* Payment Info */}
          <View style={styles.paymentInfo}>
            <IconSymbol size={20} name="shield.checkered" color="#4A86E8" />
            <ThemedText style={styles.paymentInfoText}>
              Secure payment powered by Razorpay
            </ThemedText>
          </View>
          
          {/* Transaction History Button */}
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => router.push('/coin-history')}
          >
            <ThemedText style={styles.historyButtonText}>View Transaction History</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#666" />
          </TouchableOpacity>
        </ScrollView>

        {/* Payment Modal */}
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Complete Payment
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowPaymentModal(false);
                  setProcessingPayment(null);
                }}
                style={styles.closeButton}
              >
                <IconSymbol size={24} name="xmark" color="#666" />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: paymentHtml }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#F5A623" />
                  <ThemedText style={styles.loadingText}>Loading payment...</ThemedText>
                </View>
              )}
            />
          </View>
        </Modal>
        {/* Coin Packages Modal */}
        <Modal
          visible={coinPackageModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Buy Coins
              </ThemedText>
              <TouchableOpacity
                onPress={() => setCoinPackageModal(false)}
                style={styles.closeButton}
              >
                <IconSymbol size={24} name="xmark" color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.packageScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.packageContainer}>
                {coinPackages && coinPackages.length > 0 ? coinPackages.map((packageItem) => (
                  <View key={packageItem.id || Math.random().toString()} style={styles.packageCard}>
                    {/* Angled Percentage Sticker */}
                    {/* {packageItem.extraPercentage && packageItem.extraPercentage > 0 && (
                      <View style={styles.percentageSticker}>
                        <ThemedText style={styles.percentageStickerText}>
                          +{packageItem.extraPercentage || 0}% Extra
                        </ThemedText>
                      </View>
                    )} */}
                    
                    <View style={styles.packageInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.packageCoins}>
                        {`${packageItem.coins || 0} Coins`}
                      </ThemedText>
                      <ThemedText type="subtitle" style={styles.packagePrice}>
                        {String(packageItem.priceDisplay || `₹${((packageItem.price || 0)/100).toFixed(2)}`)}
                      </ThemedText>
                      {/* {packageItem.bestValue && (
                        <View style={styles.bestValueBadge}>
                          <ThemedText style={styles.bestValueText}>Best Value</ThemedText>
                        </View>
                      )} */}
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.buyButton,
                        processingPayment === packageItem.id && styles.buyButtonProcessing
                      ]}
                      onPress={() => handleCoinPurchase(packageItem)}
                      disabled={processingPayment !== null}
                    >
                      {processingPayment === packageItem.id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                )) : (
                  <View style={styles.packageCard}>
                    <ThemedText style={styles.packageCoins}>No coin packages available</ThemedText>
                  </View>
                )}
                
                <View style={styles.paymentInfo}>
                  <IconSymbol size={20} name="shield.checkered" color="#4A86E8" />
                  <ThemedText style={styles.paymentInfoText}>
                    Secure payment powered by Razorpay
                  </ThemedText>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  packageInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  packageScrollView: {
    flex: 1,
  },
  packageContainer: {
    padding: 16,
  },
  packageIcon: {
    marginRight: 10,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  paymentInfoText: {  
    fontSize: 14,
    color: '#666',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  buyCoinsButton: {
    backgroundColor: '#4A86E8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    marginTop: 10,
    alignItems: 'center',
  },
  buyCoinsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  balanceSectionHalf: {
    flex: 1,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#F8F9FF',
    borderRadius: 16,
  }, 

  extraPercentageBadge: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  extraPercentageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceDisplay: {
    alignItems: 'center',
  },
  coinIcon: {
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  availableText: {
    fontSize: 14,
    color: '#999',
  },
  checkInCard: {
    backgroundColor: '#ECF3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  checkInCardDisabled: {
    backgroundColor: '#F5F5F5',
  },
  checkInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkInTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  checkInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  checkInSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  claimButton: {
    backgroundColor: '#4A86E8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  claimButtonDisabled: {
    backgroundColor: '#CCC',
  },
  claimButtonProcessing: {
    backgroundColor: '#4A86E8',
  },
  claimButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  claimButtonTextDisabled: {
    color: '#666',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  packagesContainer: {
    marginBottom: 24,
    gap: 16,
  },
  packageCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    marginTop: 8,
    paddingLeft: 50,
  },
  packageInfo: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 20,
  },
  packageCoins: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'left',
  },
  packagePrice: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left',
  },
  percentageSticker: {
    position: 'absolute',
    top: 8,
    left: -15,
    backgroundColor: '#F5A623',
    paddingHorizontal: 25,
    paddingVertical: 8,
    transform: [{ rotate: '-45deg' }],
    zIndex: 1,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  percentageStickerText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bestValueBadge: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  bestValueText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#4A86E8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buyButtonProcessing: {
    backgroundColor: '#4A86E8',
  },
  buyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  historyButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
}); 
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
  createPaymentOrder,
  verifyPaymentAndAddCoins,
  dailyCheckIn,
  type CoinPackage,
  type CoinBalance,
  type DailyCheckInResult
} from '@/api/services/coinService';

export default function CoinsScreen() {
  const router = useRouter();
  
  // State
  const [coinBalance, setCoinBalance] = useState<CoinBalance | null>(null);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [processingCheckIn, setProcessingCheckIn] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [currentPackageId, setCurrentPackageId] = useState<string>('');

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [balance, packages] = await Promise.all([
        getCoinBalance(),
        getCoinPackages()
      ]);
      
      setCoinBalance(balance);
      setCoinPackages(packages);
    } catch (error) {
      console.error('Error loading coin data:', error);
      Alert.alert('Error', 'Failed to load coin data. Please try again.');
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
        Alert.alert(
          'Daily Check-In Successful!',
          `You earned ${result.coinsEarned} coins! ${result.streakBonus ? '🔥 Streak bonus included!' : ''}\n\nStreak: ${result.dailyStreak} days`,
          [{ text: 'Awesome!', onPress: () => loadData() }]
        );
      }
    } catch (error: any) {
      if (error.message?.includes('already checked in')) {
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

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Coins',
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
          title: 'Coins',
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
          <ThemedView style={styles.balanceSection}>
            <ThemedText type="defaultSemiBold" style={styles.balanceLabel}>
              Your Coins
            </ThemedText>
            <View style={styles.balanceDisplay}>
              <View style={styles.coinIcon}>
                <IconSymbol size={48} name="bitcoinsign.circle.fill" color="#F5A623" />
              </View>
              <ThemedText type="title" style={styles.balanceAmount}>
                {coinBalance?.coins.toLocaleString() || '0'}
              </ThemedText>
              <ThemedText style={styles.availableText}>Available Coins</ThemedText>
            </View>
          </ThemedView>

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
            <ThemedText type="subtitle">Buy Coins</ThemedText>
          </ThemedView>
          
          <View style={styles.packagesContainer}>
            {coinPackages.map((packageItem) => (
              <View key={packageItem.id} style={styles.packageCard}>
                <View style={styles.packageInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.packageCoins}>
                    {packageItem.coins} Coins
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.packagePrice}>
                    ₹{(packageItem.price/100).toFixed(2)}
                  </ThemedText>
                  {packageItem.bestValue && (
                    <View style={styles.bestValueBadge}>
                      <ThemedText style={styles.bestValueText}>Best Value</ThemedText>
                    </View>
                  )}
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
            ))}
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
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
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
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#F8F9FF',
    borderRadius: 16,
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
    gap: 12,
  },
  packageCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageInfo: {
    flex: 1,
  },
  packageCoins: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 16,
    color: '#666',
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
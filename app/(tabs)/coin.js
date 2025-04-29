import React from 'react';
import { Layout, Text } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';

export default function CoinScreen() {
  return (
    <Layout style={styles.container}>
      <Text category='h1'>Coins</Text>
      <Text category='s1'>Your crypto dashboard</Text>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 
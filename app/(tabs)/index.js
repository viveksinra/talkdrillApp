import React from 'react';
import { Layout, Text } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <Layout style={styles.container}>
      <Text category='h1'>Home</Text>
      <Text category='s1'>Welcome to your dashboard</Text>
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
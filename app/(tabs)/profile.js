import React from 'react';
import { Layout, Text, Avatar } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <Layout style={styles.container}>
      <Avatar
        size='giant'
        style={styles.avatar}
        source={require('../../assets/images/default/defaultAvatar.png')}
      />
      <Text category='h1' style={styles.name}>Profile</Text>
      <Text category='s1'>Your account details</Text>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    margin: 8,
  },
  name: {
    marginTop: 16,
  },
}); 
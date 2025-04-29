import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spinner, Layout } from '@ui-kitten/components';

const LoadingCom = ({ size = 'medium' }) => {
  return (
    <Layout style={styles.container}>
      <Spinner size={size} />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingCom;

import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Layout style={styles.container}>
        <Text category='h1'>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text category='s1' status='primary'>Go to home screen!</Text>
        </Link>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

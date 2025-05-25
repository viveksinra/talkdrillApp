import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

export default function PrivacyContent() {
  const router = useRouter();
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedText type="title" style={styles.title}>Privacy Policy</ThemedText>
        <ThemedText style={styles.date}>Effective Date: {new Date().toLocaleDateString()}</ThemedText>
        
        <ThemedText style={styles.paragraph}>
          TalkDrill values your privacy. This Privacy Policy explains how we collect, use, and protect your information.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Information We Collect:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • Personal details (name, email, phone number)
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          • Language preferences and session history
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          • Chat and call logs (for report generation only)
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          • Payment information for in-app purchases
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>How We Use Your Information:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • To provide and personalize the TalkDrill experience
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          • To generate feedback and proficiency reports
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          • To process transactions securely
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          • To send updates, rewards, and important notifications
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Data Protection:</ThemedText>
        <ThemedText style={styles.paragraph}>
          We implement strict security measures to protect your data. We do not sell your information to third parties.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Your Choices:</ThemedText>
        <ThemedText style={styles.paragraph}>
          You can update your preferences or delete your account at any time from within the app settings.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Contact Us:</ThemedText>
        <ThemedText style={styles.paragraph}>
          If you have any questions, please contact support@talkdrill.com.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
}); 
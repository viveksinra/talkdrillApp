import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

export default function TermsContent() {
  const router = useRouter();
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedText type="title" style={styles.title}>Terms of Service</ThemedText>
        <ThemedText style={styles.date}>Effective Date: {new Date().toLocaleDateString()}</ThemedText>
        
        <ThemedText style={styles.paragraph}>
          Welcome to TalkDrill! By using our app, you agree to the following terms:
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Use of the App:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • TalkDrill is designed for personal, non-commercial use.
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          • You must be 13 years or older to use the app.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>User Conduct:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • You agree not to misuse the app or engage in harmful behavior during peer interactions.
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          • Offensive, abusive, or inappropriate content is strictly prohibited.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Purchases and Refunds:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • Coin packages and other digital goods are non-refundable once purchased.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Content Ownership:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • User-generated content (chat logs, feedback reports) remains confidential and is not shared without consent.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Account Termination:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • We reserve the right to suspend or terminate accounts violating our policies.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Limitation of Liability:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • TalkDrill is provided "as is". We are not liable for any indirect damages or losses arising from your use of the app.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Changes to the Terms:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • We may update these Terms from time to time. Continued use of TalkDrill constitutes acceptance of the new Terms.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Contact:</ThemedText>
        <ThemedText style={styles.paragraph}>
          • For questions about these Terms, please email support@talkdrill.com.
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
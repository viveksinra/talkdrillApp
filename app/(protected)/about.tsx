import { StyleSheet, ScrollView, View, TouchableOpacity, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import React from 'react';

export default function AboutScreen() {
  const router = useRouter();
  
  const openLink = (url: string) => {
    Linking.openURL(url);
  };
  
  return (
    <>
    <Stack.Screen
        options={{
          title: 'About TalkDrill',
        }}
      />
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedText style={styles.paragraph}>
          TalkDrill is your personal speaking practice partner, available 24/7. Whether you're preparing for interviews, public speaking, language learning, or just looking to boost your fluency, TalkDrill makes your journey simple and engaging.
        </ThemedText>
        
        <ThemedText style={styles.sectionTitle}>Key Features:</ThemedText>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <ThemedText>• Practice real-life conversations with AI personas.</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText>• Peer-to-peer speaking sessions with other learners.</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText>• Practice with AI or expert based on scenario.</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText>• Schedule call with English expert to boost your fluency.</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText>• Daily streaks and coin rewards to stay motivated.</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText>• Personalized session reports highlighting your strengths and areas for improvement.</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText>• Fun, interactive themes and challenges to make speaking practice a habit.</ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.paragraph}>
          With TalkDrill, you don't just learn to talk — you master the art of confident communication.
        </ThemedText>
        
        <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
        <TouchableOpacity 
          style={styles.contactItem}
          onPress={() => Linking.openURL('mailto:contact@talkdrill.com')}
        >
          <Ionicons name="mail-outline" size={20} color={Colors.light.primary} />
          <ThemedText style={styles.contactText}>contact@talkdrill.com</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.sectionTitle}>Website</ThemedText>
        <TouchableOpacity 
          style={styles.contactItem}
          onPress={() => openLink('https://www.talkdrill.com/')}
        >
          <Ionicons name="globe-outline" size={20} color={Colors.light.primary} />
          <ThemedText style={styles.contactText}>www.talkdrill.com</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.sectionTitle}>Social Media</ThemedText>
        
        <TouchableOpacity 
          style={styles.socialItem}
          onPress={() => openLink('https://www.youtube.com/@talkdrill')}
        >
          <FontAwesome name="youtube-play" size={22} color="#FF0000" />
          <ThemedText style={styles.socialText}>YouTube</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.socialItem}
          onPress={() => openLink('https://www.instagram.com/talkdrill/')}
        >
          <FontAwesome name="instagram" size={22} color="#E1306C" />
          <ThemedText style={styles.socialText}>Instagram</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.socialItem}
          onPress={() => openLink('https://x.com/TalkdrillApp')}
        >
          <FontAwesome5 name="x-twitter" size={18} color="#000000" />
          <ThemedText style={styles.socialText}>X / Twitter</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.socialItem}
          onPress={() => openLink('https://linkedin.com/company/talkdrill')}
        >
          <FontAwesome name="linkedin-square" size={20} color="#0077B5" />
          <ThemedText style={styles.socialText}>LinkedIn</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.socialItem}
          onPress={() => openLink('https://www.facebook.com/profile.php?id=61576040686850')}
        >
          <FontAwesome name="facebook-square" size={20} color="#1877F2" />
          <ThemedText style={styles.socialText}>Facebook</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.socialItem}
          onPress={() => openLink('https://whatsapp.com/channel/0029VbBKsmHGU3BKyJ24pr3J')}
        >
          <FontAwesome name="whatsapp" size={22} color="#25D366" />
          <ThemedText style={styles.socialText}>WhatsApp Channel</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.socialItem}
          onPress={() => openLink('https://t.me/talkdrill')}
        >
          <FontAwesome name="telegram" size={20} color="#0088CC" />
          <ThemedText style={styles.socialText}>Telegram Channel</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
    </>
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
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.primary,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  socialText: {
    marginLeft: 12,
    fontSize: 16,
  },
}); 
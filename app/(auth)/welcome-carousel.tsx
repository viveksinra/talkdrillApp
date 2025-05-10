import React from 'react';
import { StyleSheet, Image, View, Dimensions, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { FlatList } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width } = Dimensions.get('window');

interface CarouselItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function WelcomeCarouselScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Carousel data
  const carouselItems: CarouselItem[] = [
    {
      id: '1',
      title: 'Practice with AI',
      description: 'Chat or call with our AI assistants to practice your language skills anytime, anywhere.',
      icon: 'brain.head.profile',
    },
    {
      id: '2',
      title: 'Connect with Peers',
      description: 'Find language partners from around the world to practice together.',
      icon: 'person.2.fill',
    },
    {
      id: '3',
      title: 'Get Detailed Feedback',
      description: 'Receive personalized feedback and reports to track your progress.',
      icon: 'chart.line.uptrend.xyaxis',
    },
  ];
  
  const handleNext = () => {
    if (currentIndex < carouselItems.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last slide, go to main app
      router.replace('/(tabs)');
    }
  };
  
  const handleSkip = () => {
    // Skip onboarding and go to main app
    router.replace('/(tabs)');
  };
  
  const renderCarouselItem = ({ item }: { item: CarouselItem }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        <IconSymbol size={80} name={item.icon} color="#4A86E8" />
      </View>
      <ThemedText type="title" style={styles.title}>{item.title}</ThemedText>
      <ThemedText style={styles.description}>{item.description}</ThemedText>
    </View>
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={carouselItems}
          renderItem={renderCarouselItem}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(newIndex);
          }}
        />
        
        <View style={styles.paginationContainer}>
          {carouselItems.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.activeDot
              ]}
            />
          ))}
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}>
            <ThemedText style={styles.skipButtonText}>Skip</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}>
            <ThemedText style={styles.nextButtonText}>
              {currentIndex === carouselItems.length - 1 ? 'Get Started' : 'Next'}
            </ThemedText>
            <IconSymbol 
              size={16} 
              name={currentIndex === carouselItems.length - 1 ? "checkmark" : "chevron.right"}
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ECF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '80%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#4A86E8',
    width: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  skipButton: {
    padding: 16,
  },
  skipButtonText: {
    color: '#888',
  },
  nextButton: {
    backgroundColor: '#4A86E8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
}); 
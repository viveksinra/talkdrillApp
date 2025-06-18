import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface CircularProgressProps {
  size?: number;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  size = 32, 
  color = Colors.light.primary 
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.border,
          { 
            width: size, 
            height: size, 
            borderColor: color,
            transform: [{ rotate: spin }] 
          }
        ]}
      />
      <View style={[styles.center, { 
        width: size - 4, 
        height: size - 4,
        backgroundColor: 'white'
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  border: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 999,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: Colors.light.primary,
    borderLeftColor: Colors.light.primary,
  },
  center: {
    borderRadius: 999,
  },
});
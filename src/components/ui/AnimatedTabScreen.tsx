import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTabAnimation } from '../../hooks/useTabAnimation';

interface AnimatedTabScreenProps {
  children: ReactNode;
}

export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  const { scale, opacity } = useTabAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0f0f1a', // Fond sombre profond
  },
  container: {
    flex: 1,
  },
});

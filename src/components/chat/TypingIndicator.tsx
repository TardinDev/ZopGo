import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  streamingContent: string;
}

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function TypingIndicator({ streamingContent }: TypingIndicatorProps) {
  // Si du contenu arrive en streaming, afficher la bulle avec le texte
  if (streamingContent) {
    return (
      <View style={[styles.row]}>
        <View style={styles.bubble}>
          <Text style={styles.text}>{streamingContent}</Text>
        </View>
      </View>
    );
  }

  // Sinon, afficher les 3 points animés
  return (
    <View style={styles.row}>
      <View style={[styles.bubble, styles.dotsBubble]}>
        <AnimatedDot delay={0} />
        <AnimatedDot delay={200} />
        <AnimatedDot delay={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
  },
  dotsBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    color: '#1F2937',
  },
});

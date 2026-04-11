import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  streamingContent: string;
}

const DOT_COLORS = ['#2162FE', '#4facfe', '#8B5CF6'];

function AnimatedDot({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(0.6, { duration: 400 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.4, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, animatedStyle]} />;
}

function BlinkingCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.Text style={[styles.cursor, animatedStyle]}>▋</Animated.Text>;
}

export function TypingIndicator({ streamingContent }: TypingIndicatorProps) {
  // Avec contenu streamé : bulle assistant + curseur clignotant
  if (streamingContent) {
    return (
      <Animated.View style={styles.row} entering={FadeIn.duration(200)}>
        <View
          style={styles.bubble}
          accessibilityRole="text"
          accessibilityLabel={`Assistant en cours de rédaction : ${streamingContent}`}>
          <View style={styles.accent} />
          <Text style={styles.text}>
            {streamingContent}
            <BlinkingCursor />
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Sans contenu : trois dots gradient pulsants
  return (
    <Animated.View
      style={styles.row}
      entering={FadeIn.duration(200)}
      accessibilityRole="text"
      accessibilityLabel="L'assistant réfléchit">
      <View style={[styles.bubble, styles.dotsBubble]}>
        <AnimatedDot delay={0} color={DOT_COLORS[0]} />
        <AnimatedDot delay={200} color={DOT_COLORS[1]} />
        <AnimatedDot delay={400} color={DOT_COLORS[2]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    paddingLeft: 18,
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#4facfe',
  },
  dotsBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    paddingLeft: 20,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
  },
  cursor: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2162FE',
    fontWeight: '700',
  },
});

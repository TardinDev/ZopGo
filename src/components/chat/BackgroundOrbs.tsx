import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface OrbProps {
  size: number;
  color: string;
  startX: number;
  startY: number;
  duration: number;
  delay?: number;
}

function Orb({ size, color, startX, startY, duration, delay = 0 }: OrbProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(40, {
        duration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    translateX.value = withRepeat(
      withTiming(25, {
        duration: duration * 1.3,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [duration, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top: startY,
          left: startX,
        },
        animatedStyle,
      ]}
    />
  );
}

export function BackgroundOrbs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Orb
        size={260}
        color="rgba(33, 98, 254, 0.10)"
        startX={-80}
        startY={SCREEN_H * 0.08}
        duration={7000}
      />
      <Orb
        size={200}
        color="rgba(79, 172, 254, 0.10)"
        startX={SCREEN_W - 140}
        startY={SCREEN_H * 0.22}
        duration={9000}
      />
      <Orb
        size={180}
        color="rgba(139, 92, 246, 0.08)"
        startX={SCREEN_W * 0.4}
        startY={SCREEN_H * 0.55}
        duration={8000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
});

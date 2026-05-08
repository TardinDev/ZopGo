import { useMemo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const PALETTE = ['#2162FE', '#4facfe', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#E8A832'];

interface ConfettiPieceProps {
  startX: number;
  delay: number;
  fallDistance: number;
  sway: number;
  color: string;
  duration: number;
  size: number;
}

function ConfettiPiece({ startX, delay, fallDistance, sway, color, duration, size }: ConfettiPieceProps) {
  const ty = useSharedValue(-20);
  const tx = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    ty.value = withDelay(delay, withTiming(fallDistance, { duration, easing: Easing.out(Easing.quad) }));
    tx.value = withDelay(delay, withTiming(sway, { duration, easing: Easing.inOut(Easing.sin) }));
    rotate.value = withDelay(delay, withTiming(720, { duration }));
    opacity.value = withDelay(delay + duration - 400, withTiming(0, { duration: 400 }));
  }, [delay, duration, fallDistance, sway, ty, tx, rotate, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: startX, width: size, height: size * 1.4, backgroundColor: color },
        style,
      ]}
    />
  );
}

interface ConfettiProps {
  visible: boolean;
  count?: number;
}

/**
 * Lightweight confetti burst — no native dependency. Spawns `count` colored
 * squares from the top of the screen that fall, sway, rotate, then fade.
 * Render conditionally; the component tears itself down when `visible=false`.
 */
export function Confetti({ visible, count = 36 }: ConfettiProps) {
  const { width, height } = Dimensions.get('window');

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        color: PALETTE[i % PALETTE.length],
        startX: Math.random() * width,
        delay: Math.random() * 250,
        fallDistance: height + 60,
        sway: (Math.random() - 0.5) * 240,
        duration: 2000 + Math.random() * 800,
        size: 7 + Math.random() * 5,
      })),
    [count, width, height, visible]
  );

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});

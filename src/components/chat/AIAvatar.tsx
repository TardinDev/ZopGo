import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AIAvatarProps {
  size?: number;
  showStatus?: boolean;
  isActive?: boolean;
}

/**
 * Avatar IA avec halo pulsant + point de statut vert.
 * Utilisé dans le header et le welcome screen.
 */
export function AIAvatar({ size = 38, showStatus = true, isActive = true }: AIAvatarProps) {
  const pulse = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);
  const statusPulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.35, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    if (isActive) {
      statusPulse.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    }
  }, [pulse, pulseOpacity, statusPulse, isActive]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulseOpacity.value,
  }));

  const statusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusPulse.value }],
  }));

  const iconSize = Math.round(size * 0.55);
  const statusSize = Math.max(10, Math.round(size * 0.3));

  return (
    <View style={{ width: size, height: size }}>
      {/* Halo pulsant */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          haloStyle,
        ]}
      />

      {/* Avatar gradient */}
      <LinearGradient
        colors={['#2162FE', '#4facfe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}>
        <MaterialCommunityIcons name="robot-happy" size={iconSize} color="#FFFFFF" />
      </LinearGradient>

      {/* Point de statut online */}
      {showStatus && (
        <Animated.View
          style={[
            styles.status,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
            },
            statusStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(79, 172, 254, 0.45)',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(33, 98, 254, 0.45)',
  },
  status: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

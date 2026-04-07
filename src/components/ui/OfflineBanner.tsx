import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { COLORS } from '../../constants';
import { TIMING_CONFIG } from '../../constants/animations';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const translateY = useSharedValue(-60);

  useEffect(() => {
    translateY.value = withTiming(isConnected ? -60 : 0, TIMING_CONFIG.normal);
  }, [isConnected, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle]} accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={16} color="white" />
      <Text style={styles.text}>Pas de connexion internet</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingTop: 54,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

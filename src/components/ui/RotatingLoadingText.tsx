import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRotatingMessage } from '../../hooks/useRotatingMessage';

interface RotatingLoadingTextProps {
  messages: string[];
  intervalMs?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Small fade-in/out tagline that cycles through a list of messages.
 * Used above skeleton loaders to keep the wait feeling alive.
 */
export function RotatingLoadingText({
  messages,
  intervalMs = 2200,
  style,
}: RotatingLoadingTextProps) {
  const current = useRotatingMessage(messages, intervalMs);
  return (
    <Animated.View
      key={current}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.container}>
      <Text style={[styles.text, style]}>{current}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

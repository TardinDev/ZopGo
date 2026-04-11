import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { hapticLight, hapticMedium } from '../../utils/haptics';

const MAX_LENGTH = 2000;
const COUNTER_THRESHOLD = 1600;

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  // Scale animation on press
  const sendScale = useSharedValue(1);
  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    hapticLight();
    onSend(trimmed);
    setText('');
  };

  const handleStop = () => {
    if (!onStop) return;
    hapticMedium();
    onStop();
  };

  const canSend = text.trim().length > 0 && !disabled;
  const showCounter = text.length >= COUNTER_THRESHOLD;
  const counterNearMax = text.length >= MAX_LENGTH - 100;

  return (
    <BlurView
      intensity={40}
      tint="light"
      style={[styles.container, { paddingBottom: tabBarHeight - 8 }]}>
      <View style={styles.tint} pointerEvents="none" />

      {showCounter && (
        <Animated.Text
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.counter, counterNearMax && styles.counterWarn]}>
          {text.length}/{MAX_LENGTH}
        </Animated.Text>
      )}

      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Posez votre question à l'IA..."
          placeholderTextColor="#94A3B8"
          multiline
          maxLength={MAX_LENGTH}
          editable={!disabled}
          returnKeyType="default"
          accessibilityLabel="Message pour l'assistant"
          accessibilityHint="Tapez votre question ici"
        />

        {disabled && onStop ? (
          <Animated.View style={sendAnimatedStyle}>
            <Pressable
              onPressIn={() => {
                sendScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
              }}
              onPressOut={() => {
                sendScale.value = withSpring(1, { damping: 12, stiffness: 300 });
              }}
              onPress={handleStop}
              accessibilityRole="button"
              accessibilityLabel="Arrêter la génération">
              <View style={[styles.sendButton, styles.stopButton]}>
                <MaterialCommunityIcons name="stop" size={20} color="#FFFFFF" />
              </View>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View style={sendAnimatedStyle}>
            <Pressable
              onPressIn={() => {
                if (canSend) {
                  sendScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
                }
              }}
              onPressOut={() => {
                sendScale.value = withSpring(1, { damping: 12, stiffness: 300 });
              }}
              onPress={handleSend}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Envoyer le message"
              accessibilityState={{ disabled: !canSend }}>
              {canSend ? (
                <LinearGradient
                  colors={['#2162FE', '#4facfe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.sendButton, styles.sendButtonActive]}>
                  <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <View style={styles.sendButton}>
                  <MaterialCommunityIcons name="send" size={20} color="#94A3B8" />
                </View>
              )}
            </Pressable>
          </Animated.View>
        )}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  counter: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginBottom: 4,
    paddingRight: 4,
  },
  counterWarn: {
    color: '#EF4444',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  inputRowFocused: {
    borderColor: 'rgba(33, 98, 254, 0.45)',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#0F172A',
    maxHeight: 110,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    boxShadow: '0 4px 14px rgba(33, 98, 254, 0.45)',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
  },
});

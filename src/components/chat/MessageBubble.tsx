import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { ChatMessageItem } from '../../stores/chatStore';

interface MessageBubbleProps {
  message: ChatMessageItem;
}

function formatSmartTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;

  if (diff < 60_000) return "À l'instant";
  if (diff < 60 * 60_000) {
    const mins = Math.floor(diff / 60_000);
    return `Il y a ${mins} min`;
  }

  const date = new Date(ts);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const hhmm = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return hhmm;

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm} ${hhmm}`;
}

export const MessageBubble = React.memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const timeLabel = formatSmartTime(message.timestamp);
  const a11yLabel = isUser
    ? `Votre message : ${message.content}, ${timeLabel}`
    : `Message de l'assistant : ${message.content}, ${timeLabel}`;

  if (isUser) {
    return (
      <Animated.View
        entering={FadeInUp.duration(300).springify().damping(18)}
        style={[styles.row, styles.rowRight]}>
        <LinearGradient
          colors={['#2162FE', '#4facfe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.userBubble]}
          accessibilityRole="text"
          accessibilityLabel={a11yLabel}>
          <Text style={[styles.text, styles.userText]}>{message.content}</Text>
          <Text style={[styles.time, styles.userTime]}>{timeLabel}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify().damping(18)}
      style={[styles.row, styles.rowLeft]}>
      <View
        style={[styles.bubble, styles.assistantBubble]}
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}>
        <View style={styles.assistantAccent} />
        <Text style={[styles.text, styles.assistantText]}>{message.content}</Text>
        <Text style={[styles.time, styles.assistantTime]}>{timeLabel}</Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  userBubble: {
    borderBottomRightRadius: 6,
    boxShadow: '0 6px 16px rgba(33, 98, 254, 0.25)',
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    paddingLeft: 18,
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  assistantAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#4facfe',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantText: {
    color: '#1F2937',
  },
  time: {
    fontSize: 10,
    marginTop: 5,
    fontWeight: '500',
  },
  userTime: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },
  assistantTime: {
    color: '#9CA3AF',
  },
});

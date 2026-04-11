import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  date: string;
  time: string;
  read: boolean;
  contextLabel?: string;
}

interface MessageCardProps {
  message: Message;
  onPress: () => void;
}

export function MessageCard({ message, onPress }: MessageCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, message.read && styles.cardRead]}
      activeOpacity={0.8}>
      {/* Avatar with online indicator */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: message.avatar }}
          style={[styles.avatar, message.read && styles.avatarRead]}
        />
        {!message.read && <View style={styles.onlineIndicator} />}
      </View>

      {/* Message Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.sender, message.read && styles.senderRead]}>
            {message.sender}
          </Text>
          <Text style={styles.time}>{message.time}</Text>
        </View>
        {message.contextLabel && (
          <Text style={styles.routeLabel}>{message.contextLabel}</Text>
        )}
        <Text
          numberOfLines={2}
          style={[styles.messageText, message.read && styles.messageTextRead]}>
          {message.content}
        </Text>
        {!message.read && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Nouveau</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
  },
  cardRead: {
    backgroundColor: '#F9FAFB',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    height: 56,
    width: 56,
    borderRadius: 28,
  },
  avatarRead: {
    opacity: 0.6,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: '#22C55E',
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sender: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  senderRead: {
    fontWeight: '500',
    color: '#6B7280',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  routeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#4B5563',
  },
  messageTextRead: {
    color: '#9CA3AF',
  },
  newBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
});

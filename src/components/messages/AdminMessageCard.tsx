import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AdminMessage } from '../../types';

interface AdminMessageCardProps {
  message: AdminMessage;
  onPress: () => void;
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  return `Il y a ${diffD} jours`;
}

export const AdminMessageCard = React.memo(function AdminMessageCard({
  message,
  onPress,
}: AdminMessageCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, message.isRead && styles.cardRead]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Annonce ZopGo : ${message.title}. ${message.body}`}
      accessibilityState={{ selected: message.isRead }}>
      <View style={styles.row}>
        <View style={[styles.iconContainer, message.isRead && styles.iconContainerRead]}>
          <Ionicons
            name="megaphone"
            size={22}
            color={message.isRead ? '#9CA3AF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.senderRow}>
              <Text style={styles.senderBadge}>ZopGo</Text>
              <Text style={[styles.senderName, message.isRead && styles.mutedText]}>
                · {message.senderName}
              </Text>
            </View>
            {!message.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={[styles.title, message.isRead && styles.titleRead]}>
            {message.title}
          </Text>
          <Text
            numberOfLines={3}
            style={[styles.body, message.isRead && styles.bodyRead]}>
            {message.body}
          </Text>
          <Text style={styles.time}>{formatTimeAgo(message.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2162FE',
    boxShadow: '0 4px 14px rgba(33, 98, 254, 0.12)',
  },
  cardRead: {
    backgroundColor: '#F9FAFB',
    borderLeftColor: '#D1D5DB',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
  },
  row: { flexDirection: 'row' },
  iconContainer: {
    marginRight: 14,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#2162FE',
  },
  iconContainerRead: {
    backgroundColor: '#F3F4F6',
  },
  content: { flex: 1 },
  header: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: '#2162FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    letterSpacing: 0.4,
  },
  senderName: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  mutedText: {
    color: '#9CA3AF',
  },
  unreadDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  title: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  titleRead: {
    fontWeight: '600',
    color: '#6B7280',
  },
  body: {
    marginTop: 4,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  bodyRead: {
    color: '#9CA3AF',
  },
  time: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
});

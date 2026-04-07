import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  iconColor: string;
  iconBg: string;
  data?: Record<string, string>;
}

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export const NotificationCard = React.memo(function NotificationCard({
  notification,
  onPress,
  onAction,
  actionLabel,
}: NotificationCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, notification.read && styles.cardRead]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.message}`}
      accessibilityState={{ selected: notification.read }}>
      <View style={styles.row}>
        {/* Icon Badge */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: notification.iconBg },
            notification.read && styles.iconContainerRead,
          ]}>
          <Ionicons
            name={notification.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={notification.read ? '#9CA3AF' : notification.iconColor}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, notification.read && styles.titleRead]}>
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text
            style={[styles.message, notification.read && styles.messageRead]}
            numberOfLines={2}>
            {notification.message}
          </Text>
          {notification.data?.villeDepart && notification.data?.villeArrivee && (
            <View style={styles.routeBadge}>
              <Text style={styles.routeText}>
                {notification.data.villeDepart} → {notification.data.villeArrivee}
              </Text>
            </View>
          )}
          {notification.data?.hebergementNom && notification.data?.hebergementVille && (
            <View style={styles.hebergementBadge}>
              <Text style={styles.hebergementBadgeText}>
                {notification.data.hebergementNom} — {notification.data.hebergementVille}
              </Text>
            </View>
          )}
          <Text style={styles.time}>{notification.time}</Text>
        </View>
      </View>

      {onAction && !notification.read && (
        <TouchableOpacity
          onPress={onAction}
          style={styles.actionBtn}
          activeOpacity={0.8}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#2162FE" />
          <Text style={styles.actionText}>{actionLabel || 'Écrire'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardRead: {
    backgroundColor: '#F9FAFB',
    shadowOpacity: 0.04,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
  },
  actionBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2162FE',
  },
  iconContainer: {
    marginRight: 16,
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconContainerRead: {
    backgroundColor: '#F3F4F6',
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  titleRead: {
    fontWeight: '500',
    color: '#6B7280',
  },
  unreadDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
  },
  messageRead: {
    color: '#9CA3AF',
  },
  routeBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2162FE',
  },
  hebergementBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hebergementBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  time: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
});

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
}

interface NotificationCardProps {
    notification: Notification;
    onPress: () => void;
}

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
            {/* Icon Badge */}
            <View style={[styles.iconContainer, { backgroundColor: notification.iconBg }]}>
                <Ionicons
                    name={notification.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={notification.iconColor}
                />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{notification.title}</Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>
                    {notification.message}
                </Text>
                <Text style={styles.time}>{notification.time}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    iconContainer: {
        marginRight: 16,
        height: 48,
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
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
    time: {
        marginTop: 4,
        fontSize: 12,
        color: '#9CA3AF',
    },
});

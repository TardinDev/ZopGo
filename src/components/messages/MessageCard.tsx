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
}

interface MessageCardProps {
    message: Message;
    onPress: () => void;
}

export function MessageCard({ message, onPress }: MessageCardProps) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
            {/* Avatar with online indicator */}
            <View style={styles.avatarContainer}>
                <Image source={{ uri: message.avatar }} style={styles.avatar} />
                {!message.read && <View style={styles.onlineIndicator} />}
            </View>

            {/* Message Content */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.sender}>{message.sender}</Text>
                    <Text style={styles.time}>{message.time}</Text>
                </View>
                <Text numberOfLines={2} style={styles.messageText}>
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
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        height: 56,
        width: 56,
        borderRadius: 28,
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
    time: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    messageText: {
        fontSize: 14,
        color: '#4B5563',
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

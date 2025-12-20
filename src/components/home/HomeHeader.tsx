import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants';

interface HomeHeaderProps {
    userName: string;
    notificationCount: number;
}

export function HomeHeader({ userName, notificationCount }: HomeHeaderProps) {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.name}>{userName} 👋</Text>
                </View>

                <TouchableOpacity
                    onPress={() => router.push('/(protected)/(tabs)/messages')}
                    style={styles.notificationButton}
                    activeOpacity={0.8}>
                    <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
                    {notificationCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{notificationCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 14,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    greeting: {
        fontSize: 16,
        color: '#374151',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    notificationButton: {
        height: 48,
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        height: 20,
        width: 20,
        borderRadius: 10,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
});

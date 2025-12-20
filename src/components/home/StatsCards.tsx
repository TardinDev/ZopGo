import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stats } from '../../data';
import { COLORS } from '../../constants';

export function StatsCards() {
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {stats.map((stat) => (
                    <View key={stat.id} style={styles.card}>
                        <View style={[styles.iconContainer, { backgroundColor: getBgColor(stat.color) }]}>
                            <Ionicons
                                name={stat.icon as any}
                                size={20}
                                color={getColor(stat.color)}
                            />
                        </View>
                        <Text style={styles.value}>{stat.value}</Text>
                        <Text style={styles.subtitle}>{stat.subtitle}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

function getBgColor(color: string) {
    switch (color) {
        case 'green': return '#DCFCE7';
        case 'blue': return '#DBEAFE';
        case 'yellow': return '#FEF9C3';
        default: return '#F3F4F6';
    }
}

function getColor(color: string) {
    switch (color) {
        case 'green': return COLORS.success;
        case 'blue': return COLORS.info;
        case 'yellow': return COLORS.warning;
        default: return '#374151';
    }
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    scrollContent: {
        gap: 12,
    },
    card: {
        marginRight: 8,
        width: 150,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: 8,
        height: 40,
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9999,
    },
    value: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 12, // text-xs
        color: '#4B5563',
    },
});

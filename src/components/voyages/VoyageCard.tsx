import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Voyage } from '../../types';

interface VoyageCardProps {
    voyage: Voyage;
    onPress: () => void;
}

export function VoyageCard({ voyage, onPress }: VoyageCardProps) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {voyage.from} ➔ {voyage.to}
                    </Text>
                    <Text style={styles.subtitle}>
                        {voyage.type} • {voyage.price}
                    </Text>
                </View>
                <Text style={styles.icon}>{voyage.icon}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitle: {
        color: '#6B7280',
        marginTop: 4,
    },
    icon: {
        fontSize: 32,
    },
});

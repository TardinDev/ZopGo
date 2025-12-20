import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyResultsProps {
    message: string;
    subMessage?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyResults({
    message,
    subMessage,
    icon = 'search-outline',
}: EmptyResultsProps) {
    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={64} color="white" />
            <Text style={styles.message}>{message}</Text>
            {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    message: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        textAlign: 'center',
    },
    subMessage: {
        marginTop: 8,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
});

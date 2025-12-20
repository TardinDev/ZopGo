import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TransportSearchBarProps {
    fromCity: string;
    toCity: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onSwap: () => void;
}

export function TransportSearchBar({
    fromCity,
    toCity,
    onFromChange,
    onToChange,
    onSwap,
}: TransportSearchBarProps) {
    return (
        <View style={styles.container}>
            {/* Départ */}
            <View style={styles.inputContainer}>
                <Ionicons name="location" size={18} color="#4facfe" />
                <TextInput
                    placeholder="Départ"
                    placeholderTextColor="#9CA3AF"
                    value={fromCity}
                    onChangeText={onFromChange}
                    style={styles.input}
                />
                {fromCity.length > 0 && (
                    <TouchableOpacity onPress={() => onFromChange('')}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Bouton Swap */}
            <TouchableOpacity onPress={onSwap} style={styles.swapButton} activeOpacity={0.7}>
                <Ionicons name="swap-horizontal" size={20} color="#4facfe" />
            </TouchableOpacity>

            {/* Arrivée */}
            <View style={styles.inputContainer}>
                <Ionicons name="flag" size={18} color="#00f2fe" />
                <TextInput
                    placeholder="Arrivée"
                    placeholderTextColor="#9CA3AF"
                    value={toCity}
                    onChangeText={onToChange}
                    style={styles.input}
                />
                {toCity.length > 0 && (
                    <TouchableOpacity onPress={() => onToChange('')}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    input: {
        marginLeft: 8,
        flex: 1,
        color: '#1F2937',
    },
    swapButton: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
});

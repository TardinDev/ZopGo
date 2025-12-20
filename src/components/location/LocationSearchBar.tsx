import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../stores';

export function LocationSearchBar() {
    const { searchQuery, setSearchQuery } = useLocationStore();

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.input}
                    placeholder="Rechercher une marque, un modèle..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <Ionicons
                        name="close-circle"
                        size={20}
                        color="#9CA3AF"
                        onPress={() => setSearchQuery('')}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginBottom: 16,
        marginTop: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#1F2937',
    },
});

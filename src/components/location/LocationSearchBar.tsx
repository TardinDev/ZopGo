import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../stores';

export function LocationSearchBar() {
    const { searchQuery, setSearchQuery } = useLocationStore();

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <View style={styles.searchIcon}>
                    <Ionicons name="search" size={20} color="#10B981" />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Rechercher un véhicule..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color="#64748B" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="options" size={20} color="#10B981" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 16,
        marginTop: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchIcon: {
        padding: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#F1F5F9',
        paddingVertical: 12,
    },
    clearButton: {
        padding: 8,
    },
    filterButton: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        padding: 12,
        borderRadius: 12,
        marginLeft: 4,
    },
});

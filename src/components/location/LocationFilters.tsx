import React from 'react';
import { Text, TouchableOpacity, ScrollView, StyleSheet, View } from 'react-native';
import { useLocationStore, VehicleType } from '../../stores/locationStore';
import { Ionicons } from '@expo/vector-icons';

const filters: { id: VehicleType; label: string; icon: string }[] = [
    { id: 'tous', label: 'Tous', icon: 'apps' },
    { id: 'voiture', label: 'Voitures', icon: 'car-sport' },
    { id: 'moto', label: 'Motos', icon: 'bicycle' },
    { id: 'utilitaire', label: 'Utilitaires', icon: 'bus' },
];

export function LocationFilters() {
    const { selectedType, setSelectedType } = useLocationStore();

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
            style={{ flexGrow: 0 }}>
            {filters.map((filter) => {
                const isSelected = selectedType === filter.id;
                return (
                    <TouchableOpacity
                        key={filter.id}
                        onPress={() => setSelectedType(filter.id)}
                        activeOpacity={0.8}
                        style={[
                            styles.chip,
                            isSelected ? styles.selectedChip : styles.unselectedChip,
                        ]}>
                        <Ionicons
                            name={(isSelected ? filter.icon : `${filter.icon}-outline`) as any}
                            size={18}
                            color={isSelected ? '#000000' : '#9CA3AF'}
                        />
                        <Text style={[
                            styles.label,
                            isSelected ? styles.selectedLabel : styles.unselectedLabel,
                        ]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginBottom: 16,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        height: 44,
        borderRadius: 22,
        marginRight: 10,
        gap: 8,
    },
    selectedChip: {
        backgroundColor: '#FFFFFF',
    },
    unselectedChip: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    selectedLabel: {
        color: '#000000',
    },
    unselectedLabel: {
        color: '#9CA3AF',
    },
});

import React from 'react';
import { Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocationStore, VehicleType } from '../../stores/locationStore';
import { Ionicons } from '@expo/vector-icons';

const filters: { id: VehicleType; label: string; icon: string }[] = [
    { id: 'tous', label: 'Tous', icon: 'grid-outline' },
    { id: 'voiture', label: 'Voitures', icon: 'car-sport-outline' },
    { id: 'moto', label: 'Motos', icon: 'bicycle-outline' },
    { id: 'utilitaire', label: 'Utilitaires', icon: 'bus-outline' },
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
                        style={[
                            styles.chip,
                            isSelected ? styles.selectedChip : styles.unselectedChip,
                        ]}
                        activeOpacity={0.8}>
                        <Ionicons
                            name={filter.icon as any}
                            size={18}
                            color={isSelected ? 'white' : '#6B7280'}
                        />
                        <Text
                            style={[
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
        paddingHorizontal: 24,
        paddingBottom: 16,
        gap: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9999,
        borderWidth: 1,
        marginRight: 8,
    },
    selectedChip: {
        backgroundColor: '#10B981', // Green for Location theme
        borderColor: '#10B981',
    },
    unselectedChip: {
        backgroundColor: 'white',
        borderColor: '#E5E7EB',
    },
    label: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    selectedLabel: {
        color: 'white',
    },
    unselectedLabel: {
        color: '#6B7280',
    },
});

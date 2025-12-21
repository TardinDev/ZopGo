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
        paddingVertical: 6,
        marginBottom: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedChip: {
        backgroundColor: '#10B981',
    },
    unselectedChip: {
        backgroundColor: 'white',
    },
    label: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '700',
    },
    selectedLabel: {
        color: 'white',
    },
    unselectedLabel: {
        color: '#374151',
    },
});

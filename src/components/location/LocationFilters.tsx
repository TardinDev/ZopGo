import React from 'react';
import { Text, TouchableOpacity, ScrollView, StyleSheet, View } from 'react-native';
import { useLocationStore, VehicleType } from '../../stores/locationStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
                        style={styles.chipWrapper}>
                        {isSelected ? (
                            <LinearGradient
                                colors={['#2162FE', '#1E40AF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.chip}>
                                <Ionicons
                                    name={filter.icon as any}
                                    size={18}
                                    color="white"
                                />
                                <Text style={styles.selectedLabel}>{filter.label}</Text>
                            </LinearGradient>
                        ) : (
                            <View style={[styles.chip, styles.unselectedChip]}>
                                <Ionicons
                                    name={`${filter.icon}-outline` as any}
                                    size={18}
                                    color="#64748B"
                                />
                                <Text style={styles.unselectedLabel}>{filter.label}</Text>
                            </View>
                        )}
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
        marginBottom: 8,
        gap: 10,
    },
    chipWrapper: {
        marginRight: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        height: 44,
        borderRadius: 22,
        gap: 8,
    },
    unselectedChip: {
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    selectedLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    unselectedLabel: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
});

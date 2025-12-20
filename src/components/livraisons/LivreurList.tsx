import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LivreurCard } from './LivreurCard';

interface LivreurListProps {
    livreurs: any[];
    pickupLocation: string;
    dropoffLocation: string;
    selectedLivreurId: number | null;
    onSelectLivreur: (id: number) => void;
    onConfirm: () => void;
    onEditSearch: () => void;
}

export function LivreurList({
    livreurs,
    pickupLocation,
    dropoffLocation,
    selectedLivreurId,
    onSelectLivreur,
    onConfirm,
    onEditSearch,
}: LivreurListProps) {
    const availableCount = livreurs.filter((l) => l.disponible).length;

    return (
        <View style={styles.container}>
            {/* En-tête des résultats (Trajet) */}
            <View style={styles.headerCard}>
                <View style={styles.headerContent}>
                    <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel}>Trajet</Text>
                        <Text style={styles.routeText}>
                            {pickupLocation} → {dropoffLocation}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onEditSearch} style={styles.editButton}>
                        <Ionicons name="pencil" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.countText}>{availableCount} livreurs disponibles</Text>

            {/* Liste des livreurs */}
            {livreurs.map((item) => (
                <LivreurCard
                    key={item.id}
                    livreur={item}
                    isSelected={selectedLivreurId === item.id}
                    onSelect={onSelectLivreur}
                />
            ))}

            {/* Bouton de confirmation */}
            {selectedLivreurId !== null && (
                <TouchableOpacity
                    onPress={onConfirm}
                    style={styles.confirmButton}
                    activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}>
                        <View style={styles.buttonContent}>
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text style={styles.buttonText}>Confirmer la livraison</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
    },
    headerCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    routeInfo: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    routeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    editButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 8,
    },
    countText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
    },
    confirmButton: {
        overflow: 'hidden',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 16,
    },
    gradient: {
        paddingVertical: 20,
        paddingHorizontal: 24,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 12,
    },
});

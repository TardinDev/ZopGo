import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Livreur {
    id: number;
    prenom: string;
    vehicule: string;
    photo: string;
    etoiles: number;
    distance: number;
    disponible: boolean;
    commentaires: string[];
}

interface LivreurCardProps {
    livreur: Livreur;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

export function LivreurCard({ livreur, isSelected, onSelect }: LivreurCardProps) {
    return (
        <TouchableOpacity
            onPress={() => onSelect(livreur.id)}
            style={[styles.card, isSelected && styles.selectedCard]}
            activeOpacity={0.9}>
            <View style={styles.container}>
                <Image source={{ uri: livreur.photo }} style={styles.avatar} />
                <View style={styles.info}>
                    <View style={styles.header}>
                        <Text style={styles.name}>{livreur.prenom}</Text>
                        <View style={[styles.statusTag, livreur.disponible ? styles.statusAvailable : styles.statusBusy]}>
                            <Text style={[styles.statusText, livreur.disponible ? styles.textAvailable : styles.textBusy]}>
                                {livreur.disponible ? 'Disponible' : 'Occupé'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.details}>
                        <Text style={styles.vehicle}>{livreur.vehicule}</Text>
                        <View style={styles.rating}>
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text style={styles.ratingText}>{livreur.etoiles}</Text>
                        </View>
                    </View>

                    <View style={styles.distance}>
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text style={styles.distanceText}>{livreur.distance} km</Text>
                    </View>
                </View>
            </View>

            {isSelected && (
                <View style={styles.reviewsContainer}>
                    <Text style={styles.reviewsTitle}>Avis clients :</Text>
                    {livreur.commentaires.map((com, idx) => (
                        <View key={idx} style={styles.reviewRow}>
                            <Ionicons name="chatbox-ellipses" size={14} color="#9CA3AF" />
                            <Text style={styles.reviewText}>&quot;{com}&quot;</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: 'white',
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    selectedCard: {
        borderWidth: 4,
        borderColor: '#3B82F6',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        height: 64,
        width: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    info: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statusTag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusAvailable: {
        backgroundColor: '#DCFCE7',
    },
    statusBusy: {
        backgroundColor: '#FEE2E2',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    textAvailable: {
        color: '#15803D',
    },
    textBusy: {
        color: '#B91C1C',
    },
    details: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    vehicle: {
        color: '#4B5563',
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 4,
        fontWeight: 'bold',
        color: '#374151',
    },
    distance: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    distanceText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#6B7280',
    },
    reviewsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    reviewsTitle: {
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    reviewRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    reviewText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4B5563',
        fontStyle: 'italic',
        flex: 1,
    },
});

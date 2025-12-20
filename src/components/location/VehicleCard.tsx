import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../../data/location';
import { useLocationStore } from '../../stores';

interface VehicleCardProps {
    vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
    const { favorites, toggleFavorite } = useLocationStore();
    const isFavorite = favorites.includes(vehicle.id);

    return (
        <TouchableOpacity activeOpacity={0.9} style={styles.card}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: vehicle.image }} style={styles.image} resizeMode="cover" />

                {/* Badge disponibilité */}
                <View style={[styles.badge, vehicle.isAvailable ? styles.badgeAvailable : styles.badgeBusy]}>
                    <Text style={[styles.badgeText, vehicle.isAvailable ? styles.textAvailable : styles.textBusy]}>
                        {vehicle.isAvailable ? 'Disponible' : 'Loué'}
                    </Text>
                </View>

                {/* Bouton favoris */}
                <TouchableOpacity
                    onPress={() => toggleFavorite(vehicle.id)}
                    style={styles.favButton}
                    activeOpacity={0.8}>
                    <Ionicons
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={20}
                        color={isFavorite ? '#EF4444' : '#1F2937'}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name}>{vehicle.name}</Text>
                    <View style={styles.rating}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.ratingText}>{vehicle.rating}</Text>
                    </View>
                </View>

                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.location}>{vehicle.location}</Text>
                </View>

                <View style={styles.features}>
                    {vehicle.features.map((feature, idx) => (
                        <Text key={idx} style={styles.feature}>• {feature}</Text>
                    ))}
                </View>

                <View style={styles.footer}>
                    <View style={styles.owner}>
                        <Image source={{ uri: vehicle.owner.avatar }} style={styles.avatar} />
                        <Text style={styles.ownerName}>{vehicle.owner.name}</Text>
                    </View>
                    <Text style={styles.price}>
                        {vehicle.price} <Text style={styles.period}>/ {vehicle.period}</Text>
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 180,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    badge: {
        position: 'absolute',
        top: 16,
        left: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeAvailable: {
        backgroundColor: 'rgba(220, 252, 231, 0.9)', // green-100 opacity
    },
    badgeBusy: {
        backgroundColor: 'rgba(254, 226, 226, 0.9)', // red-100 opacity
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    textAvailable: { color: '#15803D' },
    textBusy: { color: '#B91C1C' },
    favButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        height: 36,
        width: 36,
        borderRadius: 18,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#92400E',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    location: {
        marginLeft: 6,
        color: '#6B7280',
        fontSize: 14,
    },
    features: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    feature: {
        color: '#4B5563',
        fontSize: 12,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    owner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        height: 32,
        width: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    ownerName: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    period: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: 'normal',
    },
});

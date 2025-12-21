import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Vehicle } from '../../data/location';
import { useLocationStore } from '../../stores';

interface VehicleCardProps {
    vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
    const { favorites, toggleFavorite } = useLocationStore();
    const isFavorite = favorites.includes(vehicle.id);

    return (
        <TouchableOpacity activeOpacity={0.95} style={styles.card}>
            {/* Image Section */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: vehicle.image }} style={styles.image} resizeMode="cover" />

                {/* Overlay gradient */}
                <LinearGradient
                    colors={['transparent', 'rgba(15, 23, 42, 0.8)']}
                    style={styles.imageOverlay}
                />

                {/* Badge disponibilité */}
                <View style={[styles.badge, vehicle.isAvailable ? styles.badgeAvailable : styles.badgeBusy]}>
                    <View style={[styles.statusDot, vehicle.isAvailable ? styles.dotAvailable : styles.dotBusy]} />
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
                        color={isFavorite ? '#EF4444' : 'white'}
                    />
                </TouchableOpacity>

                {/* Prix sur l'image */}
                <View style={styles.priceTag}>
                    <Text style={styles.priceAmount}>{vehicle.price}</Text>
                    <Text style={styles.pricePeriod}>/{vehicle.period}</Text>
                </View>
            </View>

            {/* Content Section */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={1}>{vehicle.name}</Text>
                    <View style={styles.rating}>
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text style={styles.ratingText}>{vehicle.rating}</Text>
                    </View>
                </View>

                <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#10B981" />
                    <Text style={styles.location}>{vehicle.location}</Text>
                </View>

                <View style={styles.features}>
                    {vehicle.features.slice(0, 3).map((feature, idx) => (
                        <View key={idx} style={styles.featureTag}>
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <View style={styles.owner}>
                        <Image source={{ uri: vehicle.owner.avatar }} style={styles.avatar} />
                        <View>
                            <Text style={styles.ownerName}>{vehicle.owner.name}</Text>
                            <Text style={styles.ownerLabel}>Propriétaire</Text>
                        </View>
                    </View>
                    <TouchableOpacity>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.bookButton}>
                            <Text style={styles.bookText}>Réserver</Text>
                            <Ionicons name="arrow-forward" size={16} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    imageContainer: {
        height: 200,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    badge: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeAvailable: {
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
    },
    badgeBusy: {
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotAvailable: {
        backgroundColor: '#6EE7B7',
    },
    dotBusy: {
        backgroundColor: '#FCA5A5',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    textAvailable: {
        color: 'white',
    },
    textBusy: {
        color: 'white',
    },
    favButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
    },
    priceTag: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
    },
    pricePeriod: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginLeft: 2,
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
        fontWeight: '700',
        color: '#F1F5F9',
        flex: 1,
        marginRight: 12,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FBBF24',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 6,
    },
    location: {
        color: '#94A3B8',
        fontSize: 14,
    },
    features: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    featureTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    featureText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        paddingTop: 16,
    },
    owner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        height: 40,
        width: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    ownerName: {
        fontSize: 14,
        color: '#F1F5F9',
        fontWeight: '600',
    },
    ownerLabel: {
        fontSize: 11,
        color: '#64748B',
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        gap: 8,
    },
    bookText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
});

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Vehicle } from '../../data/location';
import { useLocationStore } from '../../stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40; // 20px padding on each side

interface VehicleCardProps {
    vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
    const { favorites, toggleFavorite } = useLocationStore();
    const isFavorite = favorites.includes(vehicle.id);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / IMAGE_WIDTH);
        setActiveIndex(index);
    };

    const images = vehicle.images || [vehicle.images?.[0] || ''];

    return (
        <TouchableOpacity activeOpacity={0.95} style={styles.card}>
            {/* Image Carousel */}
            <View style={styles.imageContainer}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    snapToInterval={IMAGE_WIDTH}
                    snapToAlignment="center"
                    contentContainerStyle={{ width: IMAGE_WIDTH * images.length }}>
                    {images.map((imageUri, index) => (
                        <Image
                            key={index}
                            source={{ uri: imageUri }}
                            style={[styles.image, { width: IMAGE_WIDTH }]}
                            resizeMode="cover"
                        />
                    ))}
                </ScrollView>

                {/* Overlay gradient */}
                <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.95)']}
                    style={styles.imageOverlay}
                    pointerEvents="none"
                />

                {/* Pagination dots */}
                {images.length > 1 && (
                    <View style={styles.pagination}>
                        {images.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    activeIndex === index ? styles.dotActive : styles.dotInactive,
                                ]}
                            />
                        ))}
                    </View>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                    <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                            {activeIndex + 1}/{images.length}
                        </Text>
                    </View>
                )}

                {/* Badge disponibilité */}
                <View style={[
                    styles.badge,
                    vehicle.isAvailable ? styles.badgeAvailable : styles.badgeUnavailable
                ]}>
                    <View style={[
                        styles.statusDot,
                        vehicle.isAvailable ? styles.dotAvailableStatus : styles.dotUnavailableStatus
                    ]} />
                    <Text style={[
                        styles.badgeText,
                        vehicle.isAvailable ? styles.textAvailable : styles.textUnavailable
                    ]}>
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
                        color={isFavorite ? '#EF4444' : '#FFFFFF'}
                    />
                </TouchableOpacity>

                {/* Prix sur l'image */}
                <View style={styles.priceTag}>
                    <Text style={styles.priceAmount}>{vehicle.price}</Text>
                    <Text style={styles.pricePeriod}> FCFA/{vehicle.period}</Text>
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
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
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
                    <TouchableOpacity
                        style={[
                            styles.bookButton,
                            !vehicle.isAvailable && styles.bookButtonDisabled
                        ]}
                        disabled={!vehicle.isAvailable}>
                        <Text style={[
                            styles.bookText,
                            !vehicle.isAvailable && styles.bookTextDisabled
                        ]}>
                            {vehicle.isAvailable ? 'Réserver' : 'Indisponible'}
                        </Text>
                        {vehicle.isAvailable && (
                            <Ionicons name="arrow-forward" size={16} color="#000000" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111111',
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    imageContainer: {
        height: 220,
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        height: 220,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    pagination: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: '#FFFFFF',
        width: 24,
    },
    dotInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    imageCounter: {
        position: 'absolute',
        top: 16,
        right: 70,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    imageCounterText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    badge: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    badgeAvailable: {
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
    },
    badgeUnavailable: {
        backgroundColor: 'rgba(75, 85, 99, 0.9)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotAvailableStatus: {
        backgroundColor: '#86EFAC',
    },
    dotUnavailableStatus: {
        backgroundColor: '#9CA3AF',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    textAvailable: {
        color: '#FFFFFF',
    },
    textUnavailable: {
        color: '#D1D5DB',
    },
    favButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        height: 44,
        width: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    priceTag: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceAmount: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    pricePeriod: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
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
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
        marginRight: 12,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
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
        color: '#6B7280',
        fontSize: 14,
    },
    features: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    featureTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    featureText: {
        color: '#9CA3AF',
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
        gap: 12,
    },
    avatar: {
        height: 44,
        width: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    ownerName: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    ownerLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    bookButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    bookText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '700',
    },
    bookTextDisabled: {
        color: '#6B7280',
    },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants';

export function HomeActions() {
    const router = useRouter();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Bouton Voyage */}
            <TouchableOpacity
                onPress={() => router.push('/(protected)/(tabs)/voyages')}
                activeOpacity={0.9}
                style={styles.card}>
                <ImageBackground
                    source={{ uri: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80' }}
                    style={styles.bgImage}>
                    <LinearGradient
                        colors={['rgba(37, 99, 235, 0.9)', 'rgba(29, 78, 216, 0.8)']} // Blue gradient with opacity
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}>
                        <View style={styles.content}>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>Démarrer</Text>
                                <Text style={styles.title}>un voyage</Text>
                                <Text style={styles.subtitle}>Transporter des passagers</Text>
                            </View>
                            <View style={styles.iconCircle}>
                                <Text style={styles.emoji}>🚕</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>

            {/* Bouton Livraison */}
            <TouchableOpacity
                onPress={() => router.push('/(protected)/(tabs)/livraisons')}
                activeOpacity={0.9}
                style={styles.card}>
                <ImageBackground
                    source={{ uri: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=80' }} // Packages/Delivery image
                    style={styles.bgImage}>
                    <LinearGradient
                        colors={['rgba(249, 115, 22, 0.9)', 'rgba(194, 65, 12, 0.8)']} // Orange gradient with opacity
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}>
                        <View style={styles.content}>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>Livraison</Text>
                                <Text style={styles.title}>express</Text>
                                <Text style={styles.subtitle}>Livrer des colis rapidement</Text>
                            </View>
                            <View style={styles.iconCircle}>
                                <Text style={styles.emoji}>📦</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>

            {/* Bouton Location (Nouveau) */}
            <TouchableOpacity
                onPress={() => router.push('/(protected)/(tabs)/location')}
                activeOpacity={0.9}
                style={styles.card}>
                <ImageBackground
                    source={{ uri: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80' }} // Luxury car image
                    style={styles.bgImage}>
                    <LinearGradient
                        colors={['rgba(107, 114, 128, 0.8)', 'rgba(55, 65, 81, 0.9)']} // Gray transparent gradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}>
                        <View style={styles.content}>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>Louer un</Text>
                                <Text style={styles.title}>véhicule</Text>
                                <Text style={styles.subtitle}>Voitures, Utilitaires, Motos</Text>
                            </View>
                            <View style={styles.iconCircle}>
                                <Text style={styles.emoji}>🔑</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 24, // Margin bottom to avoid overlap or sticky bottom
        flex: 1,
    },
    scrollContent: {
        gap: 16,
        paddingBottom: 150, // Extra padding for the bottom sheet
    },
    card: {
        overflow: 'hidden',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
        height: 160, // Fixed height for consistency
    },
    bgImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gradient: {
        flex: 1,
        paddingVertical: 24,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold',
        color: 'white',
    },
    subtitle: {
        marginTop: 4,
        fontSize: 14, // text-sm
        color: 'rgba(255, 255, 255, 0.8)',
    },
    iconCircle: {
        height: 64,
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32, // rounded-full
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    emoji: {
        fontSize: 32, // text-4xl
    },
});

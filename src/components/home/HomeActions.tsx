import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants';

export function HomeActions() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Bouton Voyage */}
            <TouchableOpacity
                onPress={() => router.push('/(protected)/(tabs)/voyages')}
                activeOpacity={0.9}
                style={styles.card}>
                <LinearGradient
                    colors={COLORS.gradients.blue}
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
            </TouchableOpacity>

            {/* Bouton Livraison */}
            <TouchableOpacity
                onPress={() => router.push('/(protected)/(tabs)/livraisons')}
                activeOpacity={0.9}
                style={styles.card}>
                <LinearGradient
                    colors={COLORS.gradients.orange}
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
            </TouchableOpacity>

            {/* Bouton Location (Nouveau) */}
            <TouchableOpacity
                onPress={() => router.push('/(protected)/(tabs)/location')} // Route à créer plus tard ou placeholder
                activeOpacity={0.9}
                style={styles.card}>
                <LinearGradient
                    colors={['#10B981', '#059669']} // Green gradient
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
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        gap: 16,
    },
    card: {
        overflow: 'hidden',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    gradient: {
        paddingVertical: 24,
        paddingHorizontal: 24,
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

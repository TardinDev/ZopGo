import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AcceptedViewProps {
    livreur: any;
    pickupLocation: string;
    dropoffLocation: string;
    onNewDelivery: () => void;
}

export function AcceptedView({ livreur, pickupLocation, dropoffLocation, onNewDelivery }: AcceptedViewProps) {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconWrapper}>
                    <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                </View>
                <Text style={styles.title}>Demande acceptée ! 🎉</Text>
                <Text style={styles.subtitle}>
                    {livreur?.prenom} a accepté votre demande de livraison
                </Text>

                {/* Info livreur & trajet */}
                {livreur && (
                    <View style={styles.livreurCard}>
                        <View style={styles.livreurRow}>
                            <Image source={{ uri: livreur.photo }} style={styles.avatar} />
                            <View style={styles.infoText}>
                                <Text style={styles.name}>{livreur.prenom}</Text>
                                <Text style={styles.vehicle}>{livreur.vehicule}</Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                    <Text style={styles.ratingText}>{livreur.etoiles}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.tripSection}>
                            <View style={styles.locationRow}>
                                <Ionicons name="location" size={16} color="#2162FE" />
                                <Text style={styles.locationText}>{pickupLocation}</Text>
                            </View>
                            <View style={styles.locationRow}>
                                <Ionicons name="flag" size={16} color="#10B981" />
                                <Text style={styles.locationText}>{dropoffLocation}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Étapes */}
                <View style={styles.stepsBox}>
                    <Text style={styles.stepsTitle}>Prochaines étapes :</Text>
                    <View style={styles.stepRow}>
                        <Text style={styles.stepNumber}>1.</Text>
                        <Text style={styles.stepText}>Le livreur se dirige vers le point de récupération</Text>
                    </View>
                    <View style={styles.stepRow}>
                        <Text style={styles.stepNumber}>2.</Text>
                        <Text style={styles.stepText}>Récupération de votre colis</Text>
                    </View>
                    <View style={styles.stepRow}>
                        <Text style={styles.stepNumber}>3.</Text>
                        <Text style={styles.stepText}>Livraison à destination</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.buttons}>
                    <TouchableOpacity style={styles.callButton} activeOpacity={0.9}>
                        <LinearGradient
                            colors={['#2162FE', '#1E40AF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}>
                            <View style={styles.buttonContent}>
                                <Ionicons name="call" size={20} color="white" />
                                <Text style={styles.buttonText}>Appeler le livreur</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onNewDelivery} style={styles.newButton} activeOpacity={0.8}>
                        <Text style={styles.newButtonText}>Nouvelle livraison</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: 24,
        height: 80,
        width: 80,
        borderRadius: 40,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    livreurCard: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        backgroundColor: '#F0F9FF', // slight blue-ish
    },
    livreurRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        height: 64,
        width: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#4ADE80',
    },
    infoText: {
        marginLeft: 12,
        flex: 1,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    vehicle: {
        color: '#4B5563',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        marginLeft: 4,
        fontWeight: 'bold',
        color: '#374151',
        fontSize: 14,
    },
    tripSection: {
        borderTopWidth: 1,
        borderTopColor: '#DBEAFE',
        paddingTop: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    stepsBox: {
        width: '100%',
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    stepsTitle: {
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    stepNumber: {
        color: '#2563EB',
        marginRight: 8,
        fontWeight: 'bold',
    },
    stepText: {
        color: '#4B5563',
        flex: 1,
    },
    buttons: {
        width: '100%',
        gap: 12,
    },
    callButton: {
        overflow: 'hidden',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 8,
    },
    newButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingVertical: 16,
    },
    newButtonText: {
        textAlign: 'center',
        color: '#374151',
        fontWeight: '600',
    },
});

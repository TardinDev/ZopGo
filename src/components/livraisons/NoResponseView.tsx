import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface NoResponseViewProps {
    livreur: any; // On pourrait typer plus strictement
    onRetry: () => void;
    onCancel: () => void;
}

export function NoResponseView({ livreur, onRetry, onCancel }: NoResponseViewProps) {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconWrapper}>
                    <Ionicons name="time-outline" size={60} color="#EF4444" />
                </View>
                <Text style={styles.title}>Livreur non disponible</Text>
                <Text style={styles.subtitle}>
                    {livreur?.prenom} n&apos;a pas répondu à votre demande dans les temps impartis.
                </Text>

                {/* Info livreur */}
                {livreur && (
                    <View style={styles.livreurInfo}>
                        <View style={styles.livreurRow}>
                            <Image source={{ uri: livreur.photo }} style={styles.avatar} />
                            <View style={styles.infoText}>
                                <Text style={styles.name}>{livreur.prenom}</Text>
                                <Text style={styles.status}>⚠️ Aucune réponse</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Message d'encouragement */}
                <View style={styles.messageBox}>
                    <View style={styles.messageRow}>
                        <Ionicons name="information-circle" size={20} color="#2162FE" />
                        <Text style={styles.messageText}>
                            Ne vous inquiétez pas ! Il y a d&apos;autres livreurs disponibles pour vous aider.
                        </Text>
                    </View>
                </View>

                {/* Boutons */}
                <View style={styles.buttons}>
                    <TouchableOpacity onPress={onRetry} style={styles.retryButton} activeOpacity={0.9}>
                        <LinearGradient
                            colors={['#2162FE', '#1E40AF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}>
                            <View style={styles.buttonContent}>
                                <Ionicons name="search" size={22} color="white" />
                                <Text style={styles.buttonText}>Choisir un autre livreur</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onCancel} style={styles.cancelButton} activeOpacity={0.8}>
                        <Text style={styles.cancelText}>Annuler la livraison</Text>
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
        backgroundColor: '#FEE2E2',
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
    },
    livreurInfo: {
        width: '100%',
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#FECACA',
    },
    livreurRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        height: 56,
        width: 56,
        borderRadius: 28,
        opacity: 0.5,
    },
    infoText: {
        marginLeft: 12,
        flex: 1,
    },
    name: {
        fontWeight: 'bold',
        color: '#1F2937',
    },
    status: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '600',
    },
    messageBox: {
        width: '100%',
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    messageText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    buttons: {
        width: '100%',
        gap: 12,
    },
    retryButton: {
        overflow: 'hidden',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    gradient: {
        paddingVertical: 18,
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
        marginLeft: 8,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingVertical: 16,
    },
    cancelText: {
        textAlign: 'center',
        color: '#374151',
        fontWeight: '600',
    },
});

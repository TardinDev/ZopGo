import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userInfo } from '../../data';
import { COLORS } from '../../constants';

interface HomeHeaderProps {
    userName: string;
}

export function HomeHeader({ userName }: HomeHeaderProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [userRole, setUserRole] = useState<'client' | 'driver'>('client');

    const handleRoleSelect = (role: 'client' | 'driver') => {
        setUserRole(role);
        setModalVisible(false);
        // TODO: Mettre à jour le store global et l'interface
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.name}>{userName} 👋</Text>
                </View>

                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={styles.avatarButton}
                    activeOpacity={0.8}>
                    <Image
                        source={{ uri: userInfo.avatar }}
                        style={styles.avatar}
                    />
                    {/* Indicateur du rôle actuel */}
                    <View style={[styles.roleIndicator, { backgroundColor: userRole === 'client' ? COLORS.primary : COLORS.success }]}>
                        <Ionicons
                            name={userRole === 'client' ? 'person' : 'car'}
                            size={10}
                            color="white"
                        />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Modal de sélection du rôle */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Se connecter en tant que</Text>

                        <TouchableOpacity
                            style={[styles.roleOption, userRole === 'client' && styles.roleOptionActive]}
                            onPress={() => handleRoleSelect('client')}
                            activeOpacity={0.7}>
                            <View style={[styles.roleIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Ionicons name="person" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.roleTextContainer}>
                                <Text style={styles.roleTitle}>Client</Text>
                                <Text style={styles.roleSubtitle}>Commander des courses et livraisons</Text>
                            </View>
                            {userRole === 'client' && (
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleOption, userRole === 'driver' && styles.roleOptionActive]}
                            onPress={() => handleRoleSelect('driver')}
                            activeOpacity={0.7}>
                            <View style={[styles.roleIcon, { backgroundColor: COLORS.success + '20' }]}>
                                <Ionicons name="car" size={24} color={COLORS.success} />
                            </View>
                            <View style={styles.roleTextContainer}>
                                <Text style={styles.roleTitle}>Chauffeur / Livreur</Text>
                                <Text style={styles.roleSubtitle}>Accepter des courses et livraisons</Text>
                            </View>
                            {userRole === 'driver' && (
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 14,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    greeting: {
        fontSize: 16,
        color: '#374151',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    avatarButton: {
        height: 48,
        width: 48,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    avatar: {
        height: 48,
        width: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'white',
    },
    roleIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        height: 18,
        width: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 20,
    },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    roleOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '08',
    },
    roleIcon: {
        height: 48,
        width: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    roleTextContainer: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    roleSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
});

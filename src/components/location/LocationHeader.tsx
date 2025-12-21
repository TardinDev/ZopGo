import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function LocationHeader() {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <View style={styles.titleContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>Location</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>PRO</Text>
                        </View>
                    </View>
                    <Text style={styles.subtitle}>Trouvez le véhicule parfait</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={22} color="#F1F5F9" />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.mapButton}>
                            <Ionicons name="map" size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#F1F5F9',
        letterSpacing: -0.5,
    },
    badge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: '#64748B',
        marginTop: 4,
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        position: 'relative',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
    },
    notifDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    mapButton: {
        padding: 10,
        borderRadius: 12,
    },
});

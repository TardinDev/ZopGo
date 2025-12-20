import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function LocationHeader() {
    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ fontSize: 32, fontWeight: '800', color: '#1F2937' }}>Location</Text>
                    <Text style={{ color: '#6B7280', marginTop: 4 }}>Trouvez le véhicule idéal</Text>
                </View>
                <TouchableOpacity
                    style={{
                        padding: 8,
                        backgroundColor: '#F3F4F6',
                        borderRadius: 12
                    }}>
                    <Ionicons name="map-outline" size={24} color="#4B5563" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

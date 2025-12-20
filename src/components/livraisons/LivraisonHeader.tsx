import React from 'react';
import { View, Text } from 'react-native';

export function LivraisonHeader() {
    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: 'white' }}>📦 Livraison</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                Trouvez votre livreur en quelques clics
            </Text>
        </View>
    );
}

export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { Hebergement } from '../../../types';
import { useAuthStore, useFavoritesStore } from '../../../stores';
import { HebergementCard } from '../../../components/voyages';

const PURPLE = '#8B5CF6';

export default function FavoriteHebergementsScreen() {
  const router = useRouter();
  const supabaseProfileId = useAuthStore((s) => s.supabaseProfileId);
  const favorites = useFavoritesStore((s) => s.favorites);
  const isLoading = useFavoritesStore((s) => s.isLoading);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);

  // Reload each time the screen gains focus so a heart toggled elsewhere is
  // reflected, and a just-removed favourite drops out of the list.
  useFocusEffect(
    useCallback(() => {
      if (supabaseProfileId) void loadFavorites(supabaseProfileId);
    }, [supabaseProfileId, loadFavorites])
  );

  const openDetail = useCallback(
    (h: Hebergement) => {
      router.push({
        pathname: '/(protected)/(tabs)/hebergement-detail',
        params: {
          supabaseId: h.supabaseId,
          name: h.name,
          type: h.type,
          location: h.location,
          adresse: h.adresse || '',
          description: h.description || '',
          icon: h.icon,
          prixParNuit: String(h.prixParNuit),
          capacite: String(h.capacite || 1),
          disponibilite: String(h.disponibilite || 0),
          hebergeurProfileId: h.hebergeurProfileId || '',
          hebergeurName: h.hebergeurName || '',
          hebergeurAvatar: h.hebergeurAvatar || '',
          hebergeurRating: String(h.hebergeurRating || 0),
          images: JSON.stringify(h.images || []),
          amenities: JSON.stringify(h.amenities || []),
        },
      });
    },
    [router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F3F7' }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
          }}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              height: 40,
              width: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
            }}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>
            Mes logements favoris
          </Text>
        </View>

        {isLoading && favorites.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={PURPLE} />
          </View>
        ) : favorites.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 32,
            }}>
            <Ionicons name="heart-outline" size={48} color="#C4B5FD" />
            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                fontWeight: '700',
                color: '#0F172A',
                textAlign: 'center',
              }}>
              Aucun favori pour l’instant
            </Text>
            <Text
              style={{ marginTop: 6, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
              Touche le ❤️ sur un logement pour le retrouver ici.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}>
            {favorites.map((h, index) => (
              <HebergementCard
                key={h.supabaseId}
                hebergement={h}
                index={index}
                onPress={() => openDetail(h)}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

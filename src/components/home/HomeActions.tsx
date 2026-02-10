import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

interface ActionCard {
  title: [string, string];
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
  imageUri: string;
  onPress: () => void;
}

export function HomeActions() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isChauffeur = user?.role === 'chauffeur';

  const clientCards: ActionCard[] = [
    {
      title: ['Démarrer', 'un voyage'],
      subtitle: 'Transporter des passagers',
      icon: 'car-sport',
      gradientColors: ['rgba(37, 99, 235, 0.9)', 'rgba(29, 78, 216, 0.8)'],
      imageUri: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/voyages'),
    },
    {
      title: ['Livraison', 'express'],
      subtitle: 'Livrer des colis rapidement',
      icon: 'cube',
      gradientColors: ['rgba(249, 115, 22, 0.9)', 'rgba(194, 65, 12, 0.8)'],
      imageUri: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/livraisons'),
    },
    {
      title: ['Louer un', 'véhicule'],
      subtitle: 'Voitures, Utilitaires, Motos',
      icon: 'key',
      gradientColors: ['rgba(107, 114, 128, 0.8)', 'rgba(55, 65, 81, 0.9)'],
      imageUri: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/location'),
    },
    {
      title: ['Trouver un', 'hébergement'],
      subtitle: 'Hôtels, Auberges et plus',
      icon: 'bed',
      gradientColors: ['rgba(139, 92, 246, 0.9)', 'rgba(168, 85, 247, 0.8)'],
      imageUri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/hebergements'),
    },
  ];

  const chauffeurCards: ActionCard[] = [
    {
      title: ['Proposer', 'un trajet'],
      subtitle: 'Publiez vos trajets disponibles',
      icon: 'navigate',
      gradientColors: ['rgba(22, 163, 74, 0.9)', 'rgba(21, 128, 61, 0.85)'],
      imageUri: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/trajets'),
    },
    {
      title: ['Garer ma', 'voiture'],
      subtitle: 'Trouvez un parking sécurisé',
      icon: 'car',
      gradientColors: ['rgba(0, 20, 241, 0.9)', 'rgba(0, 10, 180, 0.85)'],
      imageUri: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
      onPress: () => Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive prochainement.'),
    },
    {
      title: ['Louer un', 'véhicule'],
      subtitle: 'Voitures, Utilitaires, Motos',
      icon: 'key',
      gradientColors: ['rgba(107, 114, 128, 0.8)', 'rgba(55, 65, 81, 0.9)'],
      imageUri: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/location'),
    },
    {
      title: ['Trouver un', 'hébergement'],
      subtitle: 'Hôtels, Auberges et plus',
      icon: 'bed',
      gradientColors: ['rgba(139, 92, 246, 0.9)', 'rgba(168, 85, 247, 0.8)'],
      imageUri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/hebergements'),
    },
  ];

  const cards = isChauffeur ? chauffeurCards : clientCards;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {cards.map((card, index) => (
        <TouchableOpacity
          key={index}
          onPress={card.onPress}
          activeOpacity={0.9}
          style={styles.card}>
          <ImageBackground
            source={{ uri: card.imageUri }}
            style={styles.bgImage}>
            <LinearGradient
              colors={card.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}>
              <View style={styles.content}>
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{card.title[0]}</Text>
                  <Text style={styles.title}>{card.title[1]}</Text>
                  <Text style={styles.subtitle}>{card.subtitle}</Text>
                </View>
                <View style={styles.iconCircle}>
                  <Ionicons name={card.icon} size={32} color="white" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 150,
  },
  card: {
    overflow: 'hidden',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    height: 160,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  iconCircle: {
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

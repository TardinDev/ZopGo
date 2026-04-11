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
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../../stores/authStore';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const isHebergeur = user?.role === 'hebergeur';

  const clientCards: ActionCard[] = [
    {
      title: ['Démarrer', 'un voyage'],
      subtitle: 'Réservez un trajet en toute simplicité',
      icon: 'car-sport',
      gradientColors: ['rgba(37, 99, 235, 0.9)', 'rgba(29, 78, 216, 0.8)'],
      imageUri: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/voyages'),
    },
    {
      title: ['Livraison', 'express'],
      subtitle: 'Envoyez vos colis rapidement',
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

  const hebergeurCards: ActionCard[] = [
    {
      title: ['Gérer mes', 'logements'],
      subtitle: 'Ajoutez et gérez vos hébergements',
      icon: 'home',
      gradientColors: ['rgba(139, 92, 246, 0.9)', 'rgba(168, 85, 247, 0.8)'],
      imageUri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/mes-hebergements'),
    },
    {
      title: ['Voir les', 'réservations'],
      subtitle: 'Suivez les demandes de réservation',
      icon: 'calendar',
      gradientColors: ['rgba(59, 130, 246, 0.9)', 'rgba(37, 99, 235, 0.8)'],
      imageUri: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
      onPress: () => Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive prochainement.'),
    },
    {
      title: ['Mes', 'statistiques'],
      subtitle: 'Revenus, taux d\'occupation',
      icon: 'stats-chart',
      gradientColors: ['rgba(16, 185, 129, 0.9)', 'rgba(5, 150, 105, 0.8)'],
      imageUri: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      onPress: () => Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive prochainement.'),
    },
    {
      title: ['Consulter', 'les avis'],
      subtitle: 'Avis et retours de vos voyageurs',
      icon: 'chatbubbles',
      gradientColors: ['rgba(107, 114, 128, 0.8)', 'rgba(55, 65, 81, 0.9)'],
      imageUri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      onPress: () => router.push('/(protected)/(tabs)/profil'),
    },
  ];

  const cards = isHebergeur ? hebergeurCards : isChauffeur ? chauffeurCards : clientCards;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {cards.map((card, index) => (
        <AnimatedTouchable
          key={index}
          entering={FadeInUp.delay(index * 90).duration(500).springify().damping(18)}
          onPress={card.onPress}
          activeOpacity={0.9}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={`${card.title.join(' ')}. ${card.subtitle}`}>
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
        </AnimatedTouchable>
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
    borderCurve: 'continuous',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.20)',
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

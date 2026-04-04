import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useMessagesStore } from '../../../stores';
import { useTabAnimation } from '../../../hooks/useTabAnimation';
import { useAuthStore } from '../../../stores/authStore';
import { COLORS } from '../../../constants';

export default function TabLayout() {
  const { notifications, messages } = useMessagesStore();
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = messages.filter((m) => !m.read).length;
  const totalUnread = unreadNotifications + unreadMessages;
  const { navigateToTab } = useTabAnimation();
  const { user } = useAuthStore();

  // Si l'utilisateur est un chauffeur ou hébergeur, on masque certains tabs
  const isChauffeur = user?.role === 'chauffeur';
  const isHebergeur = user?.role === 'hebergeur';

  return (
    <Tabs
      screenListeners={{
        tabPress: (e) => {
          // Récupérer le nom du tab depuis la route
          const tabName = e.target?.split('-')[0] || 'index';
          navigateToTab(tabName);
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[500],

        // --- Capsule flottante ---
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'android' ? 16 : 4,
          left: 16,
          right: 16,
          height: 72,
          borderRadius: 28,
          backgroundColor: 'transparent', // important pour voir le blur
          borderTopWidth: 0,
          overflow: 'hidden', // masque le contenu au rayon
          // Ombre douce
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            },
            android: {
              elevation: 16,
            },
          }),
        },

        // --- Fond "Liquid Glass" ---
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              // iOS/Android: le blur natif rend le verre liquide
              intensity={70}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            {/* Liseré + reflet subtil pour l’effet verre */}
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 28,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: 'rgba(255,255,255,0.35)',
                },
              ]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[
                'rgba(255,255,255,0.35)',
                'rgba(255,255,255,0.10)',
                'rgba(255,255,255,0.00)',
              ]}
              locations={[0, 0.35, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),

        // — Alignement propre des labels sous icônes —
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2, // force le label bien sous l’icône
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="trajets"
        options={{
          title: 'Mes trajets',
          href: isChauffeur ? undefined : null, // Visible uniquement pour les chauffeurs
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'map-marker-path' : 'map-marker-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="mes-hebergements"
        options={{
          title: 'Mes logements',
          href: isHebergeur ? undefined : null, // Visible uniquement pour les hébergeurs
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home-city' : 'home-city-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="voyages"
        options={{
          title: 'Voyages',
          href: (isChauffeur || isHebergeur) ? null : undefined, // Masqué pour chauffeurs et hébergeurs
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'car-side' : 'car-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="livraisons"
        options={{
          title: 'Livraisons',
          href: (isChauffeur || isHebergeur) ? null : undefined, // Masqué pour chauffeurs et hébergeurs
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'package-variant' : 'package-variant-closed'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="location"
        options={{
          title: 'Location',
          href: (isChauffeur || isHebergeur) ? null : undefined, // Masqué pour chauffeurs et hébergeurs
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'key-variant' : 'key-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'message' : 'message-outline'}
              size={26}
              color={color}
            />
          ),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.error,
            fontSize: 10,
            fontWeight: 'bold',
            minWidth: 18,
            height: 18,
          },
        }}
      />

      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'robot' : 'robot-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="hebergements"
        options={{
          title: 'Hébergements',
          href: (isChauffeur || isHebergeur) ? null : undefined, // Visible uniquement pour les clients
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'bed' : 'bed-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />



      {/* Ecrans hors tab bar */}
      <Tabs.Screen name="voyage-detail" options={{ href: null, title: 'Détail du voyage' }} />
      <Tabs.Screen name="profile-edit" options={{ href: null, title: 'Modifier le profil' }} />
      <Tabs.Screen name="personal-info" options={{ href: null, title: 'Informations personnelles' }} />
      <Tabs.Screen name="vehicles-edit" options={{ href: null, title: 'Mes véhicules' }} />
      <Tabs.Screen name="payment-methods" options={{ href: null, title: 'Méthodes de paiement' }} />
      <Tabs.Screen name="favorite-addresses" options={{ href: null, title: 'Adresses favorites' }} />
      <Tabs.Screen name="security" options={{ href: null, title: 'Sécurité' }} />
      <Tabs.Screen name="help-support" options={{ href: null, title: 'Aide & Support' }} />
      <Tabs.Screen name="settings-screen" options={{ href: null, title: 'Paramètres' }} />
      <Tabs.Screen name="conversation" options={{ href: null, title: 'Conversation' }} />
    </Tabs>
  );
}

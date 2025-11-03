import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2162FE',
        tabBarInactiveTintColor: '#6B7280',

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
                { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.35)' },
              ]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)']}
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="voyages"
        options={{
          title: 'Voyages',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'car-side' : 'car-outline'} size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="livraisons"
        options={{
          title: 'Livraisons',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'package-variant' : 'package-variant-closed'} size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'message' : 'message-outline'} size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'account' : 'account-outline'} size={26} color={color} />
          ),
        }}
      />

      {/* Ecrans hors tab bar */}
      <Tabs.Screen name="voyage-detail" options={{ href: null, title: 'Détail du voyage' }} />
      <Tabs.Screen name="profile-edit" options={{ href: null, title: 'Modifier le profil' }} />
    </Tabs>
  );
}

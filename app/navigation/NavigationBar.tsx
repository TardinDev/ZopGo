import { View, Text, TouchableOpacity } from 'react-native';
import { router, usePathname } from 'expo-router';

// Déclaration explicite des routes connues
type AppRoute =
  | '/home'
  | '/course'
  | '/delivery/Delivery'
  | '/messages'
  | '/earnings';

const navigationItems: { icon: string; label: string; route: AppRoute }[] = [
  { icon: '🏠', label: 'Accueil', route: '/home' },
  { icon: '🚐', label: 'Mini-bus', route: '/course' },
  { icon: '📦', label: 'Colis', route: '/delivery/Delivery' },
  { icon: '💬', label: 'Message', route: '/messages' },
  { icon: '💰', label: 'Gain', route: '/earnings' },
];

export default function NavigationBar() {
  const pathname = usePathname(); // pour détecter la page active

  return (
    <View className="flex-row justify-around py-4 bg-[#2162FE] border-t border-blue-300">
      {navigationItems.map(({ icon, label, route }, idx) => {
        const isActive = pathname === route;

        return (
          <TouchableOpacity
            key={idx}
            className="items-center"
            onPress={() => router.push(route as never)}
          >
            <View
              className={`w-14 h-14 rounded-full items-center justify-center shadow-md ${
                isActive ? 'bg-yellow-300' : 'bg-[#F7F7F7]'
              }`}
            >
              <Text className="text-lg">{icon}</Text>
            </View>
            <Text className="text-white text-xs mt-1">{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

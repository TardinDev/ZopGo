import { View, Text, TouchableOpacity } from 'react-native';
import { router, usePathname } from 'expo-router';

// Déclaration explicite des routes connues
type AppRoute =
  | '/home'
  | '/course/Voyage'
  | '/delivery/Delivery'
  | '/message/Message'
  | '/earnings';

const navigationItems: { icon: string; label: string; route: AppRoute }[] = [
  { icon: '🏠', label: 'Accueil', route: '/home' },
  { icon: '🚐', label: 'Mini-bus', route: '/course/Voyage' },
  { icon: '📦', label: 'Colis', route: '/delivery/Delivery' },
  { icon: '💬', label: 'Message', route: '/message/Message' },
  { icon: '💰', label: 'Gain', route: '/earnings' },
];

export default function NavigationBar() {
  const pathname = usePathname(); // pour détecter la page active

  return (
    <View className="flex-row justify-around border-t border-blue-300 bg-[#2162FE] py-4">
      {navigationItems.map(({ icon, label, route }, idx) => {
        const isActive = pathname === route;

        return (
          <TouchableOpacity
            key={idx}
            className="items-center"
            onPress={() => router.push(route as never)}>
            <View
              className={`h-14 w-14 items-center justify-center rounded-full shadow-md ${
                isActive ? 'bg-yellow-300' : 'bg-[#F7F7F7]'
              }`}>
              <Text className="text-lg">{icon}</Text>
            </View>
            <Text className="mt-1 text-xs text-white">{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

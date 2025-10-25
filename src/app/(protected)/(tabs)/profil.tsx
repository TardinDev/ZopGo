import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilTab() {
  const userInfo = {
    name: 'Pierre Ondo Mba',
    email: 'pierre.ondo@gmail.com',
    phone: '+241 06 12 34 56',
    avatar:
      'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face',
    rating: 4.8,
    totalTrips: 156,
    totalDeliveries: 89,
    memberSince: '2023',
  };

  const handleMenuPress = (index: number) => {
    switch (index) {
      case 0:
        router.push('/profile-edit');
        break;
      case 1:
        Alert.alert('Mes véhicules', 'Fonctionnalité en développement');
        break;
      case 2:
        Alert.alert('Méthodes de paiement', 'Fonctionnalité en développement');
        break;
      case 3:
        Alert.alert('Adresses favorites', 'Fonctionnalité en développement');
        break;
      case 4:
        Alert.alert('Notifications', 'Fonctionnalité en développement');
        break;
      case 5:
        Alert.alert('Sécurité', 'Fonctionnalité en développement');
        break;
      case 6:
        Alert.alert('Aide et support', 'Fonctionnalité en développement');
        break;
      case 7:
        Alert.alert('Paramètres', 'Fonctionnalité en développement');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => {
          // Ici on supprimerait le token d'auth
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Informations personnelles',
      subtitle: 'Modifier vos données',
    },
    { icon: 'car-outline', title: 'Mes véhicules', subtitle: 'Gérer vos véhicules' },
    { icon: 'card-outline', title: 'Méthodes de paiement', subtitle: 'Cartes et comptes' },
    { icon: 'location-outline', title: 'Adresses favorites', subtitle: 'Gérer vos adresses' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Paramètres des alertes' },
    { icon: 'shield-outline', title: 'Sécurité', subtitle: 'Mot de passe et authentification' },
    { icon: 'help-circle-outline', title: 'Aide et support', subtitle: 'FAQ et contact' },
    { icon: 'settings-outline', title: 'Paramètres', subtitle: 'Préférences générales' },
  ];

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header avec photo de profil */}
          <View className="items-center pb-8 pt-6">
            <Image
              source={{ uri: userInfo.avatar }}
              className="mb-4 h-24 w-24 rounded-full border-4 border-white"
            />
            <Text className="mb-1 text-2xl font-bold text-white">{userInfo.name}</Text>
            <Text className="mb-2 text-white/80">{userInfo.email}</Text>
            <View className="flex-row items-center rounded-full bg-white/20 px-4 py-2">
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text className="ml-1 font-semibold text-white">{userInfo.rating}</Text>
            </View>
          </View>

          {/* Statistiques */}
          <View className="mx-6 mb-6 rounded-2xl bg-white/10 p-6">
            <Text className="mb-4 text-center text-lg font-bold text-white">
              📊 Mes statistiques
            </Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-3xl font-bold text-white">{userInfo.totalTrips}</Text>
                <Text className="text-sm text-white/80">Voyages</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-white">{userInfo.totalDeliveries}</Text>
                <Text className="text-sm text-white/80">Livraisons</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-white">{userInfo.memberSince}</Text>
                <Text className="text-sm text-white/80">Membre depuis</Text>
              </View>
            </View>
          </View>

          {/* Menu des options */}
          <View className="flex-1 rounded-t-3xl bg-white px-6 pt-6">
            <Text className="mb-6 text-xl font-bold text-gray-800">⚙️ Paramètres</Text>

            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleMenuPress(index)}
                className="flex-row items-center border-b border-gray-100 py-4"
                activeOpacity={0.7}>
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Ionicons name={item.icon as any} size={20} color="#2162FE" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">{item.title}</Text>
                  <Text className="text-sm text-gray-500">{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}

            {/* Bouton de déconnexion */}
            <TouchableOpacity
              onPress={handleLogout}
              className="mb-6 mt-8 rounded-2xl bg-red-500 py-4">
              <Text className="text-center font-bold text-white">🚪 Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

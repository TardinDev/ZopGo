import { View, Text, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Link } from 'expo-router';

const messages = [
  {
    id: '1',
    sender: 'Brice Mbongo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    content: 'Salut, la livraison à PK5 est bien arrivée. Merci beaucoup !',
    date: "Aujourd'hui",
    time: '14:32',
    read: true,
  },
  {
    id: '2',
    sender: 'Marie Nguema',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop',
    content: 'Bonsoir, tu es disponible pour un trajet vers Ntoum demain ?',
    date: 'Hier',
    time: '18:15',
    read: false,
  },
  {
    id: '3',
    sender: 'Kevin Oba',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    content: "Tu peux m'envoyer les infos du colis pour Owendo stp ?",
    date: 'Il y a 3 jours',
    time: '10:20',
    read: true,
  },
  {
    id: '4',
    sender: 'Aïcha Minko',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    content: 'Merci pour le voyage à Port-Gentil ! Service impeccable 👍',
    date: 'Il y a 1 semaine',
    time: '16:45',
    read: false,
  },
];

const notifications = [
  {
    id: '1',
    type: 'livraison',
    title: 'Livraison acceptée',
    message: 'Mamadou a accepté votre demande de livraison vers Glass',
    time: 'Il y a 5 min',
    read: false,
    icon: 'checkmark-circle',
    iconColor: '#10B981',
    iconBg: '#D1FAE5',
  },
  {
    id: '2',
    type: 'voyage',
    title: 'Nouveau client',
    message: 'Un client souhaite réserver un voyage vers Port-Gentil',
    time: 'Il y a 1h',
    read: false,
    icon: 'car',
    iconColor: '#2162FE',
    iconBg: '#DBEAFE',
  },
  {
    id: '3',
    type: 'paiement',
    title: 'Paiement reçu',
    message: 'Vous avez reçu 15,000 FCFA pour la course vers Ntoum',
    time: 'Il y a 2h',
    read: true,
    icon: 'cash',
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
  },
  {
    id: '4',
    type: 'info',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de ZopGo est disponible',
    time: 'Hier',
    read: true,
    icon: 'information-circle',
    iconColor: '#6366F1',
    iconBg: '#E0E7FF',
  },
  {
    id: '5',
    type: 'avis',
    title: 'Nouvel avis client',
    message: 'Marie Nguema a laissé un avis 5 étoiles ⭐',
    time: 'Il y a 2 jours',
    read: true,
    icon: 'star',
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
  },
];

export default function MessagesTab() {
  const [selectedTab, setSelectedTab] = useState<'messages' | 'notifications'>('notifications');

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3">
          <Text className="text-3xl font-bold text-white">📬 Messagerie</Text>
        </View>

        {/* Tabs */}
        <View className="mx-6 mb-4 flex-row rounded-2xl bg-white/30 p-1">
          <TouchableOpacity
            onPress={() => setSelectedTab('notifications')}
            className={`flex-1 rounded-xl py-3 ${
              selectedTab === 'notifications' ? 'bg-white shadow-md' : ''
            }`}
            activeOpacity={0.8}>
            <Text
              className={`text-center font-semibold ${
                selectedTab === 'notifications' ? 'text-blue-600' : 'text-white'
              }`}>
              Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('messages')}
            className={`flex-1 rounded-xl py-3 ${
              selectedTab === 'messages' ? 'bg-white shadow-md' : ''
            }`}
            activeOpacity={0.8}>
            <Text
              className={`text-center font-semibold ${
                selectedTab === 'messages' ? 'text-blue-600' : 'text-white'
              }`}>
              Messages
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {selectedTab === 'notifications' ? (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="mb-3 flex-row rounded-2xl bg-white p-4 shadow-md"
                activeOpacity={0.8}>
                {/* Icon Badge */}
                <View
                  className="mr-4 h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: item.iconBg }}>
                  <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text className="text-base font-bold text-gray-900">{item.title}</Text>
                    {!item.read && (
                      <View className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    )}
                  </View>
                  <Text className="text-sm text-gray-600" numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-400">{item.time}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <Link
                href={{
                  pathname: '/(protected)/conversation/[id]',
                  params: { id: item.id },
                }}
                asChild>
                <TouchableOpacity className="mb-3 flex-row items-center rounded-2xl bg-white p-4 shadow-md">
                  {/* Avatar with online indicator */}
                  <View className="mr-4">
                    <Image source={{ uri: item.avatar }} className="h-14 w-14 rounded-full" />
                    {!item.read && (
                      <View className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </View>

                  {/* Message Content */}
                  <View className="flex-1">
                    <View className="mb-1 flex-row items-center justify-between">
                      <Text className="text-base font-bold text-gray-900">{item.sender}</Text>
                      <Text className="text-xs text-gray-400">{item.time}</Text>
                    </View>
                    <Text numberOfLines={2} className="text-sm text-gray-600">
                      {item.content}
                    </Text>
                    {!item.read && (
                      <View className="mt-1.5 self-start rounded-full bg-blue-100 px-2 py-0.5">
                        <Text className="text-xs font-semibold text-blue-600">Nouveau</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Link>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

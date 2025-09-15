import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const messages = [
  {
    id: '1',
    sender: 'Amadou',
    avatar: 'https://randomuser.me/api/portraits/men/15.jpg',
    content: 'Salut, la livraison est bien arrivée. Merci beaucoup !',
    date: 'Aujourd’hui',
    read: true,
  },
  {
    id: '2',
    sender: 'Fatou',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    content: 'Je voulais savoir si tu es dispo demain matin ?',
    date: 'Hier',
    read: false,
  },
  {
    id: '3',
    sender: 'Kévin',
    avatar: 'https://randomuser.me/api/portraits/men/24.jpg',
    content: 'Tu peux m’envoyer les infos du colis stp ?',
    date: 'Il y a 3 jours',
    read: true,
  },
  {
    id: '4',
    sender: 'Aïcha',
    avatar: 'https://randomuser.me/api/portraits/women/40.jpg',
    content: 'Merci pour ta rapidité ! Très bon service',
    date: 'Il y a 1 semaine',
    read: false,
  },
];

export default function Message() {
  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 p-6">
        <Text className="mb-4 text-3xl font-bold text-white">📬 Messagerie</Text>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="mb-4 flex-row items-center rounded-2xl bg-white p-4 shadow-md"
              activeOpacity={0.8}>
              <Image source={{ uri: item.avatar }} className="mr-4 h-14 w-14 rounded-full" />

              <View className="flex-1">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-800">{item.sender}</Text>
                  {!item.read && (
                    <Text className="rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                      Nouveau
                    </Text>
                  )}
                </View>
                <Text numberOfLines={1} className="text-gray-600">
                  {item.content}
                </Text>
                <Text className="mt-1 text-xs text-gray-400">{item.date}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

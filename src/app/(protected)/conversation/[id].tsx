import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

// Données de conversation par utilisateur
const conversationsData: { [key: string]: any } = {
  '1': {
    sender: 'Brice Mbongo',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    messages: [
      {
        id: '1',
        text: "Salut ! J'ai bien reçu le colis à PK5",
        sender: 'them',
        time: '14:25',
      },
      {
        id: '2',
        text: 'Tout était en parfait état',
        sender: 'them',
        time: '14:26',
      },
      {
        id: '3',
        text: 'Parfait ! Merci pour la confirmation',
        sender: 'me',
        time: '14:30',
      },
      {
        id: '4',
        text: 'Salut, la livraison à PK5 est bien arrivée. Merci beaucoup !',
        sender: 'them',
        time: '14:32',
      },
    ],
  },
  '2': {
    sender: 'Marie Nguema',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop',
    messages: [
      {
        id: '1',
        text: 'Salut !',
        sender: 'them',
        time: '18:10',
      },
      {
        id: '2',
        text: 'Tu es disponible pour un trajet vers Ntoum demain ?',
        sender: 'them',
        time: '18:15',
      },
    ],
  },
  '3': {
    sender: 'Kevin Oba',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    messages: [
      {
        id: '1',
        text: 'Bonjour',
        sender: 'them',
        time: '10:15',
      },
      {
        id: '2',
        text: "Tu peux m'envoyer les infos du colis pour Owendo stp ?",
        sender: 'them',
        time: '10:20',
      },
    ],
  },
  '4': {
    sender: 'Aïcha Minko',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    messages: [
      {
        id: '1',
        text: 'Merci pour le voyage à Port-Gentil !',
        sender: 'them',
        time: '16:40',
      },
      {
        id: '2',
        text: 'Service impeccable 👍',
        sender: 'them',
        time: '16:45',
      },
    ],
  },
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const conversation = conversationsData[id as string];
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState(conversation?.messages || []);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'me',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessageText('');
    }
  };

  if (!conversation) {
    return (
      <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 items-center justify-center">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-lg text-white">Conversation introuvable</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-white/20 bg-white/10 px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center">
            <Image source={{ uri: conversation.avatar }} className="mr-3 h-10 w-10 rounded-full" />
            <View>
              <Text className="text-lg font-bold text-white">{conversation.sender}</Text>
              <Text className="text-xs text-white/80">En ligne</Text>
            </View>
          </View>

          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={90}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
            renderItem={({ item }) => (
              <View
                className={`mb-3 max-w-[75%] ${
                  item.sender === 'me' ? 'self-end' : 'self-start'
                }`}>
                <View
                  className={`rounded-2xl px-4 py-3 ${
                    item.sender === 'me'
                      ? 'rounded-br-none bg-white'
                      : 'rounded-bl-none bg-white/90'
                  }`}>
                  <Text
                    className={`text-base ${
                      item.sender === 'me' ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                    {item.text}
                  </Text>
                </View>
                <Text
                  className={`mt-1 text-xs text-white/70 ${
                    item.sender === 'me' ? 'text-right' : 'text-left'
                  }`}>
                  {item.time}
                </Text>
              </View>
            )}
          />

          {/* Input */}
          <View className="border-t border-white/20 bg-white/10 px-4 py-3">
            <View className="flex-row items-center rounded-full bg-white px-4 py-2">
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Écrire un message..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-base text-gray-900"
                multiline
                maxLength={500}
              />

              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
                className={`ml-2 h-10 w-10 items-center justify-center rounded-full ${
                  messageText.trim() ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

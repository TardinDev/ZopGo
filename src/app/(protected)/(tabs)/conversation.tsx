export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { useAuthStore } from '../../../stores/authStore';
import {
  sendDirectMessage,
  fetchConversation,
  markMessagesAsRead,
} from '../../../lib/supabaseDirectMessages';
import type { DirectMessage } from '../../../types';

export default function ConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { supabaseProfileId } = useAuthStore();

  const receiverId = String(params.receiverId || '');
  const receiverName = String(params.receiverName || 'Utilisateur');
  const receiverAvatar = String(params.receiverAvatar || '');
  const reservationId = String(params.reservationId || '') || undefined;
  const contextLabel = String(params.contextLabel || '') || undefined;

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef<FlatList<DirectMessage>>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    if (!supabaseProfileId || !receiverId) return;
    const data = await fetchConversation(supabaseProfileId, receiverId, reservationId);
    setMessages(data);
    setIsLoading(false);
    // Mark incoming as read
    await markMessagesAsRead(supabaseProfileId, receiverId);
  }, [supabaseProfileId, receiverId, reservationId]);

  useEffect(() => {
    loadMessages();
    pollingRef.current = setInterval(loadMessages, 10000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadMessages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !supabaseProfileId || !receiverId) return;

    setIsSending(true);
    try {
      const sent = await sendDirectMessage({
        senderId: supabaseProfileId,
        receiverId,
        reservationId,
        content,
      });
      if (sent) {
        setMessages((prev) => [...prev, sent]);
        setInput('');
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: DirectMessage }) => {
    const isMine = item.senderId === supabaseProfileId;
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginVertical: 4,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            maxWidth: '75%',
            backgroundColor: isMine ? COLORS.primary : COLORS.gray[100],
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderBottomRightRadius: isMine ? 4 : 16,
            borderBottomLeftRadius: isMine ? 16 : 4,
          }}
        >
          <Text
            style={{
              color: isMine ? COLORS.white : COLORS.gray[800],
              fontSize: 15,
            }}
          >
            {item.content}
          </Text>
          <Text
            style={{
              color: isMine ? 'rgba(255,255,255,0.7)' : COLORS.gray[500],
              fontSize: 11,
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.gray[100],
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[800]} />
        </TouchableOpacity>
        {receiverAvatar ? (
          <Image
            source={{ uri: receiverAvatar }}
            style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }}
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: COLORS.gray[200],
              marginLeft: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={20} color={COLORS.gray[500]} />
          </View>
        )}
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: COLORS.gray[900],
            }}
          >
            {receiverName}
          </Text>
          {contextLabel && (
            <Text
              style={{
                fontSize: 13,
                color: COLORS.gray[500],
                marginTop: 1,
              }}
            >
              {contextLabel}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingVertical: 12 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={48}
                  color={COLORS.gray[300]}
                />
                <Text style={{ color: COLORS.gray[500], marginTop: 8 }}>
                  Commencez la conversation
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: COLORS.gray[100],
            backgroundColor: COLORS.white,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écrire un message..."
            placeholderTextColor={COLORS.gray[400]}
            style={{
              flex: 1,
              backgroundColor: COLORS.gray[100],
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              color: COLORS.gray[800],
              marginRight: 8,
            }}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isSending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: input.trim() ? COLORS.primary : COLORS.gray[300],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isSending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

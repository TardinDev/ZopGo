import React, { useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { WelcomeMessage } from './WelcomeMessage';
import type { ChatMessageItem } from '../../stores/chatStore';

export function ChatScreen() {
  const { messages, isStreaming, streamingContent, error, sendUserMessage, clearChat, dismissError } =
    useChatStore();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const userRole = user?.role ?? 'client';
  const userName = user?.profile?.name ?? 'Utilisateur';

  const handleSend = useCallback(
    (text: string) => {
      sendUserMessage(text, userRole);
      // Scroll vers le bas après un court délai
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sendUserMessage, userRole]
  );

  const handleSuggestionPress = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessageItem }) => <MessageBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: ChatMessageItem) => item.id, []);

  const renderFooter = useCallback(() => {
    if (!isStreaming) return null;
    return <TypingIndicator streamingContent={streamingContent} />;
  }, [isStreaming, streamingContent]);

  const renderEmpty = useCallback(
    () => (
      <WelcomeMessage
        userRole={userRole}
        userName={userName}
        onSuggestionPress={handleSuggestionPress}
      />
    ),
    [userRole, userName, handleSuggestionPress]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="robot-happy-outline" size={22} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Assistant IA</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="delete-outline" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Error banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={dismissError} activeOpacity={0.8}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
          <MaterialCommunityIcons name="close" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          messages.length === 0 && styles.listContentEmpty,
        ]}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

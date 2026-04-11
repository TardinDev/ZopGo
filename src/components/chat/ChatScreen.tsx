import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Alert,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { COLORS } from '../../constants';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { hapticLight, hapticSelection, hapticError, hapticSuccess } from '../../utils/haptics';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { WelcomeMessage } from './WelcomeMessage';
import { BackgroundOrbs } from './BackgroundOrbs';
import { AIAvatar } from './AIAvatar';
import type { ChatMessageItem } from '../../stores/chatStore';

export function ChatScreen() {
  const {
    messages,
    isStreaming,
    streamingContent,
    error,
    sendUserMessage,
    stopStreaming,
    retryLastMessage,
    clearChat,
    dismissError,
  } = useChatStore();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const prevAssistantCountRef = useRef(0);
  const tabBarHeight = useBottomTabBarHeight();
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const userRole = user?.role ?? 'client';
  const userName = user?.profile?.name ?? 'Utilisateur';

  // Haptic sur erreur
  useEffect(() => {
    if (error) hapticError();
  }, [error]);

  // Haptic success quand un nouveau message assistant arrive
  useEffect(() => {
    const assistantCount = messages.filter((m) => m.role === 'assistant').length;
    if (assistantCount > prevAssistantCountRef.current) {
      hapticSuccess();
    }
    prevAssistantCountRef.current = assistantCount;
  }, [messages]);

  const handleSend = useCallback(
    (text: string) => {
      hapticLight();
      sendUserMessage(text, userRole);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sendUserMessage, userRole]
  );

  const handleSuggestionPress = useCallback(
    (text: string) => {
      hapticSelection();
      sendUserMessage(text, userRole);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sendUserMessage, userRole]
  );

  const handleStop = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const handleRetry = useCallback(() => {
    hapticLight();
    retryLastMessage(userRole);
  }, [retryLastMessage, userRole]);

  const handleClear = useCallback(() => {
    if (messages.length === 0) return;
    Alert.alert(
      'Effacer la conversation',
      'Voulez-vous vraiment supprimer toute la conversation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            hapticSelection();
            clearChat();
          },
        },
      ]
    );
  }, [clearChat, messages.length]);

  const handleScrollToBottom = useCallback(() => {
    hapticLight();
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      setShowScrollToBottom(distanceFromBottom > 200);
    },
    []
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

  const canRetry = !!error && messages.some((m) => m.role === 'user');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}>
      {/* Fond animé avec orbes */}
      <BackgroundOrbs />

      {/* Header glass */}
      <Animated.View entering={FadeInDown.duration(400).springify().damping(18)}>
        <BlurView intensity={30} tint="light" style={styles.headerBlur}>
          <View style={styles.headerTint} pointerEvents="none" />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <AIAvatar size={42} showStatus isActive={!isStreaming} />
              <View>
                <Text style={styles.headerTitle}>ZopAssistant</Text>
                <View style={styles.headerStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isStreaming ? '#F59E0B' : '#10B981' },
                    ]}
                  />
                  <Text style={styles.headerSubtitle}>
                    {isStreaming ? 'En train d\'écrire…' : 'En ligne · Gemini 2.5'}
                  </Text>
                </View>
              </View>
            </View>
            {messages.length > 0 && (
              <Pressable
                onPress={handleClear}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Effacer la conversation"
                style={({ pressed }) => [
                  styles.clearBtn,
                  pressed && styles.clearBtnPressed,
                ]}>
                <MaterialCommunityIcons name="delete-sweep-outline" size={20} color="#475569" />
              </Pressable>
            )}
          </View>
        </BlurView>
      </Animated.View>

      {/* Error banner */}
      {error && (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.errorText} numberOfLines={3}>
            {error}
          </Text>
          <View style={styles.errorActions}>
            {canRetry && (
              <TouchableOpacity
                onPress={handleRetry}
                style={styles.retryBtn}
                accessibilityRole="button"
                accessibilityLabel="Réessayer">
                <MaterialCommunityIcons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={dismissError}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fermer le message d'erreur">
              <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Liste des messages */}
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
        onScroll={handleScroll}
        scrollEventThrottle={100}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* FAB scroll-to-bottom */}
      {showScrollToBottom && messages.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.scrollFab, { bottom: tabBarHeight + 90 }]}
          pointerEvents="box-none">
          <TouchableOpacity
            onPress={handleScrollToBottom}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Défiler vers le bas"
            style={styles.scrollFabBtn}>
            <MaterialCommunityIcons name="arrow-down" size={20} color="#2162FE" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} onStop={handleStop} disabled={isStreaming} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4FF',
  },
  headerBlur: {
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 14,
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnPressed: {
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
    boxShadow: '0 6px 16px rgba(239, 68, 68, 0.35)',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 17,
    fontWeight: '500',
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollFab: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
  },
  scrollFabBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(33, 98, 254, 0.15)',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)',
  },
});

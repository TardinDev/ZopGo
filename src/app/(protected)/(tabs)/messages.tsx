import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useMessagesStore } from '../../../stores';
import { TabSelector } from '../../../components/voyages';
import { NotificationCard, MessageCard } from '../../../components/messages';

// Définition des onglets
const TABS = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'messages', label: 'Messages' },
];

export default function MessagesTab() {
  const router = useRouter();

  // État global Zustand
  const {
    selectedTab,
    notifications,
    messages,
    setSelectedTab,
    markNotificationAsRead,
    markMessageAsRead,
  } = useMessagesStore();

  // Handlers
  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab as 'notifications' | 'messages');
  }, [setSelectedTab]);

  const handleNotificationPress = useCallback((notificationId: string) => {
    markNotificationAsRead(notificationId);
    console.log('Opening notification:', notificationId);
  }, [markNotificationAsRead]);

  const handleMessagePress = useCallback((messageId: string) => {
    markMessageAsRead(messageId);
    console.log('Opening conversation:', messageId);
    // router.push({ pathname: '/(protected)/conversation/[id]', params: { id: messageId } });
  }, [markMessageAsRead]);

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>📬 Messagerie</Text>
        </View>

        {/* Onglets */}
        <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
          <TabSelector
            tabs={TABS}
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
          />
        </View>

        {/* Content */}
        {selectedTab === 'notifications' ? (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={() => handleNotificationPress(item.id)}
              />
            )}
          />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <MessageCard
                message={item}
                onPress={() => handleMessagePress(item.id)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

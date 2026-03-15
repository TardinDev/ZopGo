export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect } from 'react';
import { COLORS } from '../../../constants';
import { useMessagesStore, useAuthStore } from '../../../stores';
import { AnimatedTabScreen } from '../../../components/ui';
import { TabSelector } from '../../../components/voyages';
import { NotificationCard, MessageCard } from '../../../components/messages';

// Définition des onglets
const TABS = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'messages', label: 'Messages' },
];

export default function MessagesTab() {
  const { user, supabaseProfileId } = useAuthStore();
  // État global Zustand
  const {
    selectedTab,
    notifications,
    messages,
    setSelectedTab,
    markNotificationAsRead,
    markMessageAsRead,
    loadNotifications,
  } = useMessagesStore();

  // Charger les notifications au montage
  useEffect(() => {
    if (supabaseProfileId && user) {
      loadNotifications(supabaseProfileId, user.role);
    }
  }, [supabaseProfileId, user?.role, user, loadNotifications]);

  // Handlers
  const handleTabChange = useCallback(
    (tab: string) => {
      setSelectedTab(tab as 'notifications' | 'messages');
    },
    [setSelectedTab]
  );

  const handleNotificationPress = useCallback(
    (notificationId: string) => {
      markNotificationAsRead(notificationId);
    },
    [markNotificationAsRead]
  );

  const handleMessagePress = useCallback(
    (messageId: string) => {
      markMessageAsRead(messageId);
    },
    [markMessageAsRead]
  );

  return (
    <AnimatedTabScreen>
      <LinearGradient colors={COLORS.gradients.messages} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>📬 Messagerie</Text>
          </View>

          {/* Onglets */}
          <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
            <TabSelector tabs={TABS} selectedTab={selectedTab} onTabChange={handleTabChange} />
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
                <MessageCard message={item} onPress={() => handleMessagePress(item.id)} />
              )}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </AnimatedTabScreen>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, Text, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants';
import { useMessagesStore, useAuthStore, useReservationsStore } from '../../../stores';
import { AnimatedTabScreen } from '../../../components/ui';
import { TabSelector } from '../../../components/voyages';
import { NotificationCard, MessageCard } from '../../../components/messages';

// Définition des onglets
const TABS = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'messages', label: 'Messages' },
];

export default function MessagesTab() {
  const router = useRouter();
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
    loadConversations,
  } = useMessagesStore();

  const { acceptReservation, refuseReservation } = useReservationsStore();

  // Charger les notifications au montage
  useEffect(() => {
    if (supabaseProfileId && user) {
      loadNotifications(supabaseProfileId, user.role);
      loadConversations(supabaseProfileId);
    }
  }, [supabaseProfileId, user?.role, user, loadNotifications, loadConversations]);

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

  const openConversation = useCallback(
    (partnerId: string, partnerName: string, partnerAvatar: string, reservationId?: string) => {
      router.push({
        pathname: '/(protected)/(tabs)/conversation',
        params: {
          receiverId: partnerId,
          receiverName: partnerName,
          receiverAvatar: partnerAvatar,
          reservationId: reservationId || '',
        },
      });
    },
    [router]
  );

  const handleReservationAction = useCallback(
    (notification: typeof notifications[number]) => {
      const data = notification.data || {};
      const reservationId = data.reservationId;
      const clientId = data.clientId;
      const clientName = data.clientName || 'Client';
      const trajetId = data.trajetId;

      if (!reservationId || !clientId || !supabaseProfileId || !user) {
        return;
      }

      Alert.alert(
        'Réservation',
        `${clientName} souhaite réserver votre trajet.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Refuser',
            style: 'destructive',
            onPress: async () => {
              await refuseReservation({
                reservationId,
                clientId,
                chauffeurId: supabaseProfileId,
                trajetId: trajetId || '',
                nombrePlaces: 1,
                currentPlaces: 0,
              });
              markNotificationAsRead(notification.id);
            },
          },
          {
            text: 'Accepter',
            onPress: async () => {
              const chauffeurName = user.profile?.name || 'Chauffeur';
              await acceptReservation({
                reservationId,
                clientId,
                chauffeurName,
                chauffeurId: supabaseProfileId,
              });
              markNotificationAsRead(notification.id);
            },
          },
        ]
      );
    },
    [supabaseProfileId, user, acceptReservation, refuseReservation, markNotificationAsRead]
  );

  const getNotificationAction = useCallback(
    (notification: typeof notifications[number]) => {
      const data = notification.data || {};

      if (notification.type === 'reservation') {
        return {
          onAction: () => handleReservationAction(notification),
          actionLabel: 'Accepter / Refuser',
        };
      }

      if (notification.type === 'reservation_acceptee' && data.chauffeurId) {
        return {
          onAction: () =>
            openConversation(
              data.chauffeurId,
              data.chauffeurName || 'Chauffeur',
              '',
              data.reservationId
            ),
          actionLabel: 'Écrire au chauffeur',
        };
      }

      if (notification.type === 'reservation_refusee' && data.chauffeurId) {
        return {
          onAction: () =>
            openConversation(
              data.chauffeurId,
              data.chauffeurName || 'Chauffeur',
              '',
              data.reservationId
            ),
          actionLabel: 'Écrire',
        };
      }

      return {};
    },
    [handleReservationAction, openConversation]
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
              renderItem={({ item }) => {
                const action = getNotificationAction(item);
                return (
                  <NotificationCard
                    notification={item}
                    onPress={() => handleNotificationPress(item.id)}
                    onAction={action.onAction}
                    actionLabel={action.actionLabel}
                  />
                );
              }}
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
                  onPress={() => {
                    handleMessagePress(item.id);
                    if (item.partnerId) {
                      openConversation(item.partnerId, item.sender, item.avatar);
                    }
                  }}
                />
              )}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </AnimatedTabScreen>
  );
}

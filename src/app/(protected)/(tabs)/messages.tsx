export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, Text, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../constants';
import {
  useMessagesStore,
  useAuthStore,
  useReservationsStore,
  useAdminMessagesStore,
} from '../../../stores';
import { AnimatedTabScreen } from '../../../components/ui';
import { TabSelector } from '../../../components/voyages';
import {
  NotificationCard,
  MessageCard,
  AdminMessageCard,
} from '../../../components/messages';

// Définition des onglets
const TABS = [
  { key: 'annonces', label: 'Annonces' },
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

  const {
    acceptReservation,
    refuseReservation,
    acceptHebergementReservation,
    refuseHebergementReservation,
  } = useReservationsStore();

  const { adminMessages, loadAdminMessages, markAsRead: markAdminMessageAsRead } =
    useAdminMessagesStore();

  // Charger notifications, conversations et annonces admin au focus + polling 15s
  useFocusEffect(
    useCallback(() => {
      if (!supabaseProfileId || !user) return;

      const refresh = () => {
        loadNotifications(supabaseProfileId, user.role);
        loadConversations(supabaseProfileId);
        loadAdminMessages(supabaseProfileId);
      };

      refresh();
      const interval = setInterval(refresh, 15000);
      return () => clearInterval(interval);
    }, [
      supabaseProfileId,
      user,
      loadNotifications,
      loadConversations,
      loadAdminMessages,
    ])
  );

  // Handlers
  const handleTabChange = useCallback(
    (tab: string) => {
      setSelectedTab(tab as 'annonces' | 'notifications' | 'messages');
    },
    [setSelectedTab]
  );

  const handleAdminMessagePress = useCallback(
    (messageId: string) => {
      if (!supabaseProfileId) return;
      markAdminMessageAsRead(messageId, supabaseProfileId);
    },
    [supabaseProfileId, markAdminMessageAsRead]
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
    (partnerId: string, partnerName: string, partnerAvatar: string, reservationId?: string, contextLabel?: string) => {
      router.push({
        pathname: '/(protected)/(tabs)/conversation',
        params: {
          receiverId: partnerId,
          receiverName: partnerName,
          receiverAvatar: partnerAvatar,
          reservationId: reservationId || '',
          contextLabel: contextLabel || '',
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
      const villeDepart = data.villeDepart;
      const villeArrivee = data.villeArrivee;
      const routeLabel = villeDepart && villeArrivee ? `${villeDepart} → ${villeArrivee}` : '';

      if (!reservationId || !clientId || !supabaseProfileId || !user) {
        return;
      }

      const alertMessage = routeLabel
        ? `${clientName} souhaite réserver votre trajet ${routeLabel}.`
        : `${clientName} souhaite réserver votre trajet.`;

      Alert.alert(
        'Réservation',
        alertMessage,
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
                villeDepart,
                villeArrivee,
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
                villeDepart,
                villeArrivee,
              });
              markNotificationAsRead(notification.id);
            },
          },
        ]
      );
    },
    [supabaseProfileId, user, acceptReservation, refuseReservation, markNotificationAsRead]
  );

  const handleHebergementReservationAction = useCallback(
    (notification: typeof notifications[number]) => {
      const data = notification.data || {};
      const reservationId = data.hebergementReservationId;
      const clientId = data.clientId;
      const clientName = data.clientName || 'Client';
      const hebergementId = data.hebergementId;
      const hebergementNom = data.hebergementNom;
      const hebergementVille = data.hebergementVille;

      if (!reservationId || !clientId || !supabaseProfileId || !user) {
        return;
      }

      const contextLabel = hebergementNom && hebergementVille
        ? `${hebergementNom} — ${hebergementVille}`
        : '';
      const alertMessage = contextLabel
        ? `${clientName} souhaite réserver ${contextLabel}.`
        : `${clientName} souhaite réserver votre hébergement.`;

      Alert.alert(
        'Demande de réservation',
        alertMessage,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Refuser',
            style: 'destructive',
            onPress: async () => {
              await refuseHebergementReservation({
                reservationId,
                clientId,
                hebergeurId: supabaseProfileId,
                hebergementId: hebergementId || '',
                currentDisponibilite: 0,
                hebergementNom,
                hebergementVille,
              });
              markNotificationAsRead(notification.id);
            },
          },
          {
            text: 'Accepter',
            onPress: async () => {
              const hebergeurName = user.profile?.name || 'Hébergeur';
              await acceptHebergementReservation({
                reservationId,
                clientId,
                hebergeurName,
                hebergeurId: supabaseProfileId,
                hebergementNom,
                hebergementVille,
              });
              markNotificationAsRead(notification.id);
            },
          },
        ]
      );
    },
    [supabaseProfileId, user, acceptHebergementReservation, refuseHebergementReservation, markNotificationAsRead]
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
        const label = data.villeDepart && data.villeArrivee
          ? `${data.villeDepart} → ${data.villeArrivee}`
          : '';
        return {
          onAction: () =>
            openConversation(
              data.chauffeurId,
              data.chauffeurName || 'Chauffeur',
              '',
              data.reservationId,
              label
            ),
          actionLabel: 'Écrire au chauffeur',
        };
      }

      if (notification.type === 'reservation_refusee' && data.chauffeurId) {
        const label = data.villeDepart && data.villeArrivee
          ? `${data.villeDepart} → ${data.villeArrivee}`
          : '';
        return {
          onAction: () =>
            openConversation(
              data.chauffeurId,
              data.chauffeurName || 'Chauffeur',
              '',
              data.reservationId,
              label
            ),
          actionLabel: 'Écrire',
        };
      }

      // ── Hébergement reservations ──

      if (notification.type === 'hebergement_reservation') {
        return {
          onAction: () => handleHebergementReservationAction(notification),
          actionLabel: 'Accepter / Refuser',
        };
      }

      if (notification.type === 'hebergement_reservation_acceptee' && data.hebergeurId) {
        const label = data.hebergementNom && data.hebergementVille
          ? `${data.hebergementNom} — ${data.hebergementVille}`
          : '';
        return {
          onAction: () =>
            openConversation(
              data.hebergeurId,
              data.hebergeurName || 'Hébergeur',
              '',
              data.hebergementReservationId,
              label
            ),
          actionLabel: "Écrire à l'hébergeur",
        };
      }

      if (notification.type === 'hebergement_reservation_refusee' && data.hebergeurId) {
        const label = data.hebergementNom && data.hebergementVille
          ? `${data.hebergementNom} — ${data.hebergementVille}`
          : '';
        return {
          onAction: () =>
            openConversation(
              data.hebergeurId,
              data.hebergeurName || 'Hébergeur',
              '',
              data.hebergementReservationId,
              label
            ),
          actionLabel: 'Écrire',
        };
      }

      return {};
    },
    [handleReservationAction, handleHebergementReservationAction, openConversation]
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
          {selectedTab === 'annonces' && (
            <FlatList
              data={adminMessages}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                  <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>
                    Aucune annonce pour le moment.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <AdminMessageCard
                  message={item}
                  onPress={() => handleAdminMessagePress(item.id)}
                />
              )}
            />
          )}
          {selectedTab === 'notifications' && (
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
          )}
          {selectedTab === 'messages' && (
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
                      openConversation(item.partnerId, item.sender, item.avatar, item.reservationId, item.contextLabel);
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

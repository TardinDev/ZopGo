export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, Text, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../constants';
import { useSupabaseSubscription } from '../../../hooks/useSupabaseSubscription';
import {
  useMessagesStore,
  useAuthStore,
  useReservationsStore,
  useAdminMessagesStore,
} from '../../../stores';
import { toast } from '../../../stores/toastStore';
import { AnimatedTabScreen, EmptyState } from '../../../components/ui';
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

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!supabaseProfileId || !user) return;
    setRefreshing(true);
    try {
      await Promise.all([
        loadNotifications(supabaseProfileId, user.role),
        loadConversations(supabaseProfileId),
        loadAdminMessages(supabaseProfileId),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [supabaseProfileId, user, loadNotifications, loadConversations, loadAdminMessages]);

  // Refresh on focus — pulls everything fresh when the user lands on the tab.
  useFocusEffect(
    useCallback(() => {
      if (!supabaseProfileId || !user) return;
      loadNotifications(supabaseProfileId, user.role);
      loadConversations(supabaseProfileId);
      loadAdminMessages(supabaseProfileId);
    }, [supabaseProfileId, user, loadNotifications, loadConversations, loadAdminMessages])
  );

  // Realtime fan-out instead of the previous 15s interval. Each
  // subscription is filtered to the current user so we don't get
  // notified for events that don't concern them.
  const refreshNotifications = useCallback(() => {
    if (supabaseProfileId && user) loadNotifications(supabaseProfileId, user.role);
  }, [supabaseProfileId, user, loadNotifications]);

  const refreshConversations = useCallback(() => {
    if (supabaseProfileId) loadConversations(supabaseProfileId);
  }, [supabaseProfileId, loadConversations]);

  const refreshAdminMessages = useCallback(() => {
    if (supabaseProfileId) loadAdminMessages(supabaseProfileId);
  }, [supabaseProfileId, loadAdminMessages]);

  useSupabaseSubscription({
    table: 'notifications',
    filter: supabaseProfileId ? `recipient_id=eq.${supabaseProfileId}` : undefined,
    onChange: refreshNotifications,
    enabled: !!supabaseProfileId,
  });

  useSupabaseSubscription({
    table: 'direct_messages',
    filter: supabaseProfileId ? `receiver_id=eq.${supabaseProfileId}` : undefined,
    onChange: refreshConversations,
    enabled: !!supabaseProfileId,
  });

  useSupabaseSubscription({
    table: 'admin_messages',
    onChange: refreshAdminMessages,
    enabled: !!supabaseProfileId,
  });

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
              const ok = await refuseReservation({
                reservationId,
                clientId,
                chauffeurId: supabaseProfileId,
                villeDepart,
                villeArrivee,
              });
              markNotificationAsRead(notification.id);
              if (!ok) {
                toast.info('Le client a déjà annulé sa demande.', {
                  title: 'Trop tard',
                });
              }
            },
          },
          {
            text: 'Accepter',
            onPress: async () => {
              const chauffeurName = user.profile?.name || 'Transporteur';
              const ok = await acceptReservation({
                reservationId,
                clientId,
                chauffeurName,
                chauffeurId: supabaseProfileId,
                villeDepart,
                villeArrivee,
              });
              markNotificationAsRead(notification.id);
              if (!ok) {
                toast.info('Le client a annulé entre-temps, aucune course créée.', {
                  title: 'Trop tard',
                });
              }
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
              data.chauffeurName || 'Transporteur',
              '',
              data.reservationId,
              label
            ),
          actionLabel: 'Écrire au transporteur',
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
              data.chauffeurName || 'Transporteur',
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
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="white"
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon="megaphone-outline"
                  title="Pas d'annonce pour le moment"
                  description="Reviens plus tard, l'équipe ZopGo prépare des choses..."
                  iconSize={56}
                />
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
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="white"
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon="notifications-outline"
                  title="Aucune notification"
                  description="On t'enverra un signal dès qu'il se passe quelque chose."
                  iconSize={56}
                />
              }
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
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="white"
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon="chatbubbles-outline"
                  title="Pas encore de messages"
                  description="Tes échanges avec transporteurs et hébergeurs apparaitront ici."
                  iconSize={56}
                />
              }
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

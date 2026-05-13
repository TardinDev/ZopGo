import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import type { Reservation } from '../../types';

type ChauffeurAction = 'start' | 'arrive' | 'complete';

interface ActiveReservationCardProps {
  reservation: Reservation;
  onAction: (action: ChauffeurAction) => void;
  busy?: boolean;
}

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  acceptee: { text: 'Acceptée', color: '#2162FE', bg: '#DBEAFE' },
  en_route: { text: 'En route', color: '#F59E0B', bg: '#FEF3C7' },
  arrivee: { text: 'Arrivé', color: '#10B981', bg: '#D1FAE5' },
  terminee: { text: 'Terminée', color: '#6B7280', bg: '#F3F4F6' },
};

export function ActiveReservationCard({
  reservation,
  onAction,
  busy,
}: ActiveReservationCardProps) {
  const label = STATUS_LABEL[reservation.status] || STATUS_LABEL.acceptee;
  const route =
    reservation.villeDepart && reservation.villeArrivee
      ? `${reservation.villeDepart} → ${reservation.villeArrivee}`
      : '—';

  // Determine the next action available based on current status.
  const next: { action: ChauffeurAction; label: string; icon: string } | null =
    reservation.status === 'acceptee'
      ? { action: 'start', label: 'Démarrer', icon: 'play' }
      : reservation.status === 'en_route'
      ? { action: 'arrive', label: 'Je suis arrivé', icon: 'map-marker-check' }
      : reservation.status === 'arrivee'
      ? { action: 'complete', label: 'Terminer la course', icon: 'flag-checkered' }
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.route} numberOfLines={1}>
            {route}
          </Text>
          <Text style={styles.client}>
            {reservation.clientName || 'Client'} · {reservation.nombrePlaces} place
            {reservation.nombrePlaces > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: label.bg }]}>
          <Text style={[styles.statusText, { color: label.color }]}>{label.text}</Text>
        </View>
      </View>

      {next ? (
        <TouchableOpacity
          onPress={() => onAction(next.action)}
          disabled={!!busy}
          style={[styles.actionBtn, busy && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel={next.label}
        >
          <MaterialCommunityIcons name={next.icon as never} size={18} color="white" />
          <Text style={styles.actionText}>{next.label}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.doneRow}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
          <Text style={styles.doneText}>Course terminée</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  route: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  client: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  actionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  doneText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
});

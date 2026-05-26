import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import type { Reservation } from '../../types';

interface ReservationStatusBannerProps {
  reservation: Reservation;
  // True when the viewer is the client (cancel + rate are client actions).
  isClient: boolean;
  onCancel?: () => void;
  onRate?: () => void;
  cancelling?: boolean;
}

interface StatusVisual {
  label: string;
  icon: string;
  bg: string;
  fg: string;
}

const STATUS: Record<string, StatusVisual> = {
  en_attente: {
    label: 'En attente du transporteur',
    icon: 'clock-outline',
    bg: '#FEF3C7',
    fg: '#92400E',
  },
  acceptee: {
    label: 'Réservation acceptée',
    icon: 'check-circle',
    bg: '#D1FAE5',
    fg: '#065F46',
  },
  en_route: {
    label: 'Transporteur en route',
    icon: 'navigation-variant',
    bg: '#DBEAFE',
    fg: '#1E40AF',
  },
  arrivee: {
    label: 'Le transporteur est arrivé',
    icon: 'map-marker-check',
    bg: '#D1FAE5',
    fg: '#065F46',
  },
  terminee: {
    label: 'Course terminée',
    icon: 'flag-checkered',
    bg: '#EDE9FE',
    fg: '#5B21B6',
  },
  refusee: {
    label: 'Réservation refusée',
    icon: 'close-circle',
    bg: '#FEE2E2',
    fg: '#991B1B',
  },
  annulee: {
    label: 'Réservation annulée',
    icon: 'close-circle-outline',
    bg: '#F3F4F6',
    fg: '#6B7280',
  },
  expiree: {
    label: 'Demande expirée',
    icon: 'timer-sand-empty',
    bg: '#F3F4F6',
    fg: '#6B7280',
  },
};

export function ReservationStatusBanner({
  reservation,
  isClient,
  onCancel,
  onRate,
  cancelling,
}: ReservationStatusBannerProps) {
  const v = STATUS[reservation.status] || STATUS.en_attente;
  const canCancel = isClient && reservation.status === 'en_attente';
  const canRate = isClient && reservation.status === 'terminee' && !reservation.reviewed;

  const handleCancelPress = () => {
    if (!onCancel) return;
    Alert.alert(
      'Annuler la réservation',
      'Es-tu sûr de vouloir annuler cette demande ? Le transporteur sera prévenu.',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Annuler la résa', style: 'destructive', onPress: onCancel },
      ]
    );
  };

  return (
    <View style={[styles.wrap, { backgroundColor: v.bg }]}>
      <MaterialCommunityIcons name={v.icon as never} size={20} color={v.fg} />
      <View style={styles.body}>
        <Text style={[styles.label, { color: v.fg }]} numberOfLines={1}>
          {v.label}
        </Text>
        {reservation.villeDepart && reservation.villeArrivee && (
          <Text style={[styles.sub, { color: v.fg }]} numberOfLines={1}>
            {reservation.villeDepart} → {reservation.villeArrivee}
          </Text>
        )}
      </View>
      {canCancel && (
        <TouchableOpacity
          onPress={handleCancelPress}
          disabled={cancelling}
          style={[styles.action, { borderColor: v.fg }]}
        >
          <Text style={[styles.actionText, { color: v.fg }]}>Annuler</Text>
        </TouchableOpacity>
      )}
      {canRate && (
        <TouchableOpacity
          onPress={onRate}
          style={[styles.actionFilled, { backgroundColor: v.fg }]}
        >
          <MaterialCommunityIcons name="star" size={14} color="white" />
          <Text style={styles.actionFilledText}>Noter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  sub: {
    fontSize: 11,
    marginTop: 1,
    opacity: 0.8,
  },
  action: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  actionFilledText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
});

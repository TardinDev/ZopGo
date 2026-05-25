import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { fetchPayment, isTerminalStatus, subscribeToPayment } from '../../lib/payments';
import type { Payment, PaymentStatus } from '../../types';

interface PaymentStatusModalProps {
  visible: boolean;
  paymentId: string | null;
  initialStatus?: PaymentStatus;
  initialMessage?: string;
  onClose: () => void;
  onSuccess?: (payment: Payment) => void;
  onFailure?: (payment: Payment) => void;
}

function STATUS_META(status: PaymentStatus) {
  switch (status) {
    case 'pending':
    case 'processing':
      return {
        title: 'Paiement en cours…',
        body: 'Confirme la transaction sur ton téléphone.',
        color: COLORS.primary,
        bg: '#EFF6FF',
        icon: 'time-outline' as const,
      };
    case 'succeeded':
      return {
        title: 'Paiement réussi',
        body: 'Ta réservation est confirmée.',
        color: COLORS.success,
        bg: '#D1FAE5',
        icon: 'checkmark-circle' as const,
      };
    case 'failed':
      return {
        title: 'Paiement échoué',
        body: 'Réessaie ou choisis une autre méthode.',
        color: COLORS.error,
        bg: '#FEE2E2',
        icon: 'close-circle' as const,
      };
    case 'cancelled':
      return {
        title: 'Paiement annulé',
        body: 'Aucun montant n\'a été débité.',
        color: '#6B7280',
        bg: '#F3F4F6',
        icon: 'ban' as const,
      };
    case 'refunded':
      return {
        title: 'Remboursé',
        body: 'Le montant a été remboursé sur ton compte.',
        color: '#6B7280',
        bg: '#F3F4F6',
        icon: 'arrow-undo' as const,
      };
  }
}

export function PaymentStatusModal({
  visible,
  paymentId,
  initialStatus,
  initialMessage,
  onClose,
  onSuccess,
  onFailure,
}: PaymentStatusModalProps) {
  const [status, setStatus] = useState<PaymentStatus>(initialStatus ?? 'pending');
  const [payment, setPayment] = useState<Payment | null>(null);

  // Initial fetch + realtime subscription. The Edge Function returns the
  // payment row in 'processing' (mobile money) or 'succeeded' (mock /
  // PayPal sandbox). We watch for UPDATE events to flip to the terminal
  // state when the provider webhook fires.
  useEffect(() => {
    if (!visible || !paymentId) return;

    let mounted = true;
    void (async () => {
      const initial = await fetchPayment(paymentId);
      if (!mounted) return;
      if (initial) {
        setPayment(initial);
        setStatus(initial.status);
      }
    })();

    const sub = subscribeToPayment(paymentId, (next) => {
      setPayment(next);
      setStatus(next.status);
      if (next.status === 'succeeded' && onSuccess) onSuccess(next);
      if (next.status === 'failed' && onFailure) onFailure(next);
    });

    return () => {
      mounted = false;
      sub.unsubscribe();
    };
  }, [visible, paymentId, onSuccess, onFailure]);

  // Reset when the modal closes so the next opening starts fresh.
  useEffect(() => {
    if (!visible) {
      setStatus(initialStatus ?? 'pending');
      setPayment(null);
    }
  }, [visible, initialStatus]);

  const meta = STATUS_META(status);
  const terminal = isTerminalStatus(status);
  const isLoading = !terminal;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={terminal ? onClose : () => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
            {isLoading ? (
              <ActivityIndicator color={meta.color} size="large" />
            ) : (
              <Ionicons name={meta.icon} size={48} color={meta.color} />
            )}
          </View>
          <Text style={styles.title}>{meta.title}</Text>
          <Text style={styles.body}>
            {payment?.errorMessage || initialMessage || meta.body}
          </Text>

          {terminal && (
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={[styles.cta, { backgroundColor: meta.color }]}>
              <Text style={styles.ctaText}>
                {status === 'succeeded' ? 'Continuer' : 'Fermer'}
              </Text>
            </TouchableOpacity>
          )}

          {!terminal && (
            <Text style={styles.help}>Tu peux fermer cette fenêtre, on te préviendra par notification.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: 24,
    borderCurve: 'continuous',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.20)',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  ctaText: { color: 'white', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  help: { marginTop: 14, fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});

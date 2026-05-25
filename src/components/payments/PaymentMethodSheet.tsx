import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, TextInput } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentMethod, PaymentCurrency } from '../../types';
import { COLORS } from '../../constants';

interface MethodOption {
  method: PaymentMethod;
  label: string;
  hint: string;
  color: string;
  bg: string;
  emoji: string;
  needsPhone: boolean;
}

// Brand colours for each provider. Aplats (no gradient) so we stay aligned
// with the "avoid AI-look" rule.
const METHOD_OPTIONS: MethodOption[] = [
  {
    method: 'airtel_money',
    label: 'Airtel Money',
    hint: 'Paiement par USSD sur ton numéro Airtel',
    color: '#ED1C24',
    bg: '#FEE2E2',
    emoji: '📱',
    needsPhone: true,
  },
  {
    method: 'moov_money',
    label: 'Moov Money',
    hint: 'Paiement par USSD sur ton numéro Moov',
    color: '#0066B3',
    bg: '#DBEAFE',
    emoji: '📱',
    needsPhone: true,
  },
  {
    method: 'paypal',
    label: 'PayPal',
    hint: 'Paiement par carte ou solde PayPal',
    color: '#003087',
    bg: '#DBEAFE',
    emoji: '💳',
    needsPhone: false,
  },
];

interface PaymentMethodSheetProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  currency: PaymentCurrency;
  onConfirm: (input: { method: PaymentMethod; payerPhone?: string }) => void;
}

function formatAmount(value: number, currency: PaymentCurrency): string {
  const fmt = value.toLocaleString('fr-FR').replace(/[  ]/g, ' ').replace(/,/g, ' ');
  return `${fmt} ${currency === 'XAF' ? 'Fcfa' : currency}`;
}

function isPhoneValid(phone: string): boolean {
  // Lenient: must contain at least 8 digits once non-digits are stripped.
  return phone.replace(/\D/g, '').length >= 8;
}

function normalizePhone(phone: string): string {
  // Strip spaces; ensure starts with + if it looks international.
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed.replace(/\s/g, '');
  // Gabon default country code if user typed a local number.
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 8 || digits.length === 9) {
    return '+241' + digits;
  }
  return '+' + digits;
}

export function PaymentMethodSheet({
  visible,
  onClose,
  amount,
  currency,
  onConfirm,
}: PaymentMethodSheetProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const selected = selectedMethod
    ? METHOD_OPTIONS.find((o) => o.method === selectedMethod)
    : null;

  const handleConfirm = () => {
    if (!selected) return;
    if (selected.needsPhone) {
      if (!isPhoneValid(phone)) {
        setPhoneError('Numéro de téléphone invalide.');
        return;
      }
      onConfirm({ method: selected.method, payerPhone: normalizePhone(phone) });
    } else {
      onConfirm({ method: selected.method });
    }
  };

  const handleClose = () => {
    setSelectedMethod(null);
    setPhone('');
    setPhoneError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      accessibilityViewIsModal>
      <Pressable
        style={styles.backdrop}
        onPress={handleClose}
        accessibilityLabel="Fermer le menu de paiement"
        accessibilityRole="button">
        <Pressable onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.grabber} />

            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Mode de paiement</Text>
                <Text style={styles.subtitle}>
                  Total : <Text style={styles.amount}>{formatAmount(amount, currency)}</Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeButton}>
                <Ionicons name="close" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Method list */}
            <View style={styles.methodList}>
              {METHOD_OPTIONS.map((opt, i) => {
                const isActive = selectedMethod === opt.method;
                return (
                  <TouchableOpacity
                    key={opt.method}
                    onPress={() => {
                      setSelectedMethod(opt.method);
                      setPhoneError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Payer avec ${opt.label}`}
                    accessibilityState={{ selected: isActive }}
                    style={[
                      styles.methodRow,
                      i < METHOD_OPTIONS.length - 1 && styles.methodRowDivider,
                      isActive && { backgroundColor: opt.bg },
                    ]}>
                    <View style={[styles.methodIcon, { backgroundColor: opt.bg }]}>
                      <Text style={styles.methodEmoji}>{opt.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.methodLabel, isActive && { color: opt.color }]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.methodHint}>{opt.hint}</Text>
                    </View>
                    {isActive ? (
                      <View style={[styles.checkCircle, { backgroundColor: opt.color }]}>
                        <Ionicons name="checkmark" size={14} color="white" />
                      </View>
                    ) : (
                      <View style={styles.uncheckedCircle} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Phone input (mobile money only) */}
            {selected?.needsPhone && (
              <View style={styles.phoneSection}>
                <Text style={styles.phoneLabel}>NUMÉRO {selected.label.toUpperCase()}</Text>
                <View
                  style={[
                    styles.phoneInputWrap,
                    phoneError ? { borderColor: '#DC2626' } : null,
                  ]}>
                  <Text style={styles.phonePrefix}>+241</Text>
                  <TextInput
                    value={phone.startsWith('+241') ? phone.slice(4) : phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="066 12 34 56"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    style={styles.phoneInput}
                    accessibilityLabel="Numéro de téléphone pour le paiement"
                  />
                </View>
                {phoneError ? (
                  <Text style={styles.phoneError}>{phoneError}</Text>
                ) : (
                  <Text style={styles.phoneHelp}>
                    Tu recevras une notification USSD pour confirmer le paiement.
                  </Text>
                )}
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!selected}
              accessibilityRole="button"
              accessibilityLabel={
                selected
                  ? `Payer ${formatAmount(amount, currency)} avec ${selected.label}`
                  : 'Choisir une méthode de paiement'
              }
              accessibilityState={{ disabled: !selected }}
              style={[
                styles.ctaButton,
                {
                  backgroundColor: selected ? selected.color : '#D1D5DB',
                  opacity: selected ? 1 : 0.7,
                },
              ]}>
              <Text style={styles.ctaText}>
                {selected ? `Payer ${formatAmount(amount, currency)}` : 'Choisir une méthode'}
              </Text>
              {selected && <Ionicons name="arrow-forward" size={18} color="white" />}
            </TouchableOpacity>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    boxShadow: '0 -8px 24px rgba(15, 23, 42, 0.18)',
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  amount: { color: '#0F172A', fontWeight: '700', fontVariant: ['tabular-nums'] },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginBottom: 14,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  methodRowDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodEmoji: { fontSize: 20 },
  methodLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  methodHint: { marginTop: 2, fontSize: 12, color: '#6B7280' },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  phoneSection: { marginBottom: 14 },
  phoneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  phonePrefix: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginRight: 6 },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 12,
    fontVariant: ['tabular-nums'],
  },
  phoneError: { marginTop: 6, fontSize: 12, color: '#DC2626' },
  phoneHelp: { marginTop: 6, fontSize: 12, color: '#6B7280' },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: 14,
    gap: 8,
  },
  ctaText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

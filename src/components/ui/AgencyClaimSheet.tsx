import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const TEAL = '#0D9488';

interface AgencyClaimSheetProps {
  visible: boolean;
  onClose: () => void;
  // Returns true once the promotion succeeded (sheet closes itself).
  onClaim: (code: string) => Promise<{ ok: true; agencyName: string } | { ok: false; message: string }>;
}

// Bottom sheet used by the in-app mode switcher (settings-screen) so that an
// existing account can be promoted to role='agence' without re-signing up.
// Mirrors the look of LogoutSheet for visual consistency with the other
// "decision" sheets in the app.
export function AgencyClaimSheet({ visible, onClose, onClaim }: AgencyClaimSheetProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Saisis le code remis par ZopGo.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await onClaim(trimmed);
    setSubmitting(false);
    if (result.ok) {
      setAgencyName(result.agencyName);
      // Let the success state breathe for a beat before closing — gives the
      // user time to read the agency name they just claimed.
      setTimeout(() => {
        setCode('');
        setAgencyName(null);
        onClose();
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setCode('');
    setError(null);
    setAgencyName(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <SafeAreaView edges={['bottom']} style={styles.sheet}>
              <View style={styles.handle} />

              {agencyName ? (
                <View style={styles.successWrap}>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark" size={28} color="white" />
                  </View>
                  <Text style={styles.successTitle}>Bienvenue dans la team ZopGo !</Text>
                  <Text style={styles.successAgency}>{agencyName}</Text>
                  <Text style={styles.successHint}>
                    Ton compte est désormais en mode Agence — tu peux publier des lignes
                    bus, train, avion ou bateaux.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.headerRow}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="business" size={22} color={TEAL} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.title}>Je deviens une agence</Text>
                      <Text style={styles.subtitle}>
                        Entre le code d&apos;invitation remis par ZopGo lors de la signature
                        du partenariat.
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      error && styles.inputContainerError,
                    ]}>
                    <Ionicons name="key" size={18} color={TEAL} />
                    <TextInput
                      style={styles.input}
                      value={code}
                      onChangeText={(t) => {
                        setCode(t.toUpperCase());
                        if (error) setError(null);
                      }}
                      placeholder="ZOPGO-AGENCE-XXXX"
                      placeholderTextColor={COLORS.gray[400]}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!submitting}
                    />
                  </View>

                  {error && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting || !code.trim()}
                    style={[
                      styles.submitButton,
                      (submitting || !code.trim()) && styles.submitButtonDisabled,
                    ]}
                    activeOpacity={0.85}>
                    {submitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.submitText}>Valider le code</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={submitting}
                    style={styles.cancelButton}
                    activeOpacity={0.7}>
                    <Text style={styles.cancelText}>Annuler</Text>
                  </TouchableOpacity>
                </>
              )}
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 4, fontSize: 13, color: COLORS.gray[500], lineHeight: 18 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputContainerError: { borderColor: '#DC2626' },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginLeft: 10,
    letterSpacing: 1,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitText: { color: 'white', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: COLORS.gray[500] },
  successWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  successAgency: { marginTop: 4, fontSize: 20, fontWeight: '800', color: TEAL },
  successHint: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});

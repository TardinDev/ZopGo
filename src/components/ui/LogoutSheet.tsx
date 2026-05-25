import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { UserRole } from '../../types';
import { COLORS } from '../../constants';

const HEBERGEUR_COLOR = '#8B5CF6';
const ROLE_META: Record<UserRole, { label: string; icon: string; color: string; tint: string }> = {
  client: { label: 'Client', icon: '👤', color: COLORS.primary, tint: '#EFF6FF' },
  chauffeur: { label: 'Transporteur', icon: '🚗', color: COLORS.primary, tint: '#EFF6FF' },
  hebergeur: { label: 'Hébergeur', icon: '🏨', color: HEBERGEUR_COLOR, tint: '#F3E8FF' },
};

interface LogoutSheetProps {
  visible: boolean;
  onClose: () => void;
  currentRole: UserRole;
  availableRoles: UserRole[];
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
}

export function LogoutSheet({
  visible,
  onClose,
  currentRole,
  availableRoles,
  onSwitchRole,
  onLogout,
}: LogoutSheetProps) {
  // Switch options = every granted role except the one already active.
  const switchOptions = availableRoles.filter((r) => r !== currentRole);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fermer le menu de déconnexion"
        accessibilityHint="Ferme la feuille sans action">
        {/* The sheet itself: tapping inside shouldn't close. */}
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetWrap}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            {/* Grabber */}
            <View style={styles.grabber} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Que veux-tu faire ?</Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeButton}>
                <Ionicons name="close" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Switch-role options */}
            {switchOptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>BASCULER VERS UN AUTRE MODE</Text>
                {switchOptions.map((role, i) => {
                  const meta = ROLE_META[role];
                  return (
                    <TouchableOpacity
                      key={role}
                      onPress={() => onSwitchRole(role)}
                      accessibilityRole="button"
                      accessibilityLabel={`Basculer vers ${meta.label}`}
                      style={[
                        styles.row,
                        i < switchOptions.length - 1 && styles.rowDivider,
                      ]}>
                      <View style={[styles.iconCircle, { backgroundColor: meta.tint }]}>
                        <Text style={styles.iconEmoji}>{meta.icon}</Text>
                      </View>
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>{meta.label}</Text>
                        <Text style={styles.rowSubtitle}>Bascule sans te reconnecter</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Logout — always present, destructive */}
            <View style={styles.section}>
              <TouchableOpacity
                onPress={onLogout}
                accessibilityRole="button"
                accessibilityLabel="Se déconnecter et fermer l'application"
                style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Se déconnecter</Text>
                  <Text style={styles.rowSubtitle}>Ferme la session ZopGo</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FCA5A5" />
              </TouchableOpacity>
            </View>
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
  sheetWrap: {
    // Pressable wrapper so tapping inside the sheet doesn't bubble to backdrop.
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderCurve: 'continuous',
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 18,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
});

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '../../constants';
import { useAuthStore } from '../../stores/authStore';
import { generateAvatarPlaceholder } from '../../lib/supabaseAvatar';
import { LogoutSheet, ModeTransition } from '../ui';
import type { UserRole } from '../../types';

interface HomeHeaderProps {
  userName: string;
}

export function HomeHeader({ userName }: HomeHeaderProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [logoutSheetVisible, setLogoutSheetVisible] = useState(false);
  const [transitionRole, setTransitionRole] = useState<UserRole | null>(null);
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { user, logout, setDisponible, switchRole } = useAuthStore();
  const isChauffeur = user?.role === 'chauffeur';
  const isHebergeur = user?.role === 'hebergeur';
  const isDisponible = (isChauffeur || isHebergeur) && user?.profile && 'disponible' in user.profile && user.profile.disponible;

  const availableRoles = (user?.roles && user.roles.length > 0
    ? user.roles
    : user
    ? [user.role]
    : []) as UserRole[];

  const openLogoutSheet = () => {
    setModalVisible(false);
    setLogoutSheetVisible(true);
  };

  const handleSwitchRole = useCallback(
    (newRole: UserRole) => {
      if (!user || newRole === user.role) {
        setLogoutSheetVisible(false);
        return;
      }
      // Close the sheet so the transition overlay isn't competing with it.
      setLogoutSheetVisible(false);
      // Persist to Clerk in the background so the next cold start picks up
      // the new active role from `unsafeMetadata.role`. Fire-and-forget so
      // the transition feels instant — if the network call fails the local
      // switch still applies for this session.
      if (clerkUser) {
        clerkUser
          .update({
            unsafeMetadata: {
              ...(clerkUser.unsafeMetadata ?? {}),
              role: newRole,
            },
          })
          .catch((err) => {
            if (__DEV__) console.warn('switchRole clerk persist failed:', err);
          });
      }
      // Sync local state + Supabase (fire-and-forget inside switchRole).
      switchRole(newRole);
      // Show the animated "Mode X" overlay (~1.2s). Navigation happens in
      // handleTransitionComplete so the user doesn't see screens shuffle.
      setTransitionRole(newRole);
    },
    [user, clerkUser, switchRole]
  );

  const handleTransitionComplete = useCallback(() => {
    setTransitionRole(null);
    // No router.replace here: HomeHeader lives on the home tab which is
    // present for every role, so the Zustand role change is enough to
    // re-render the tab bar. We deliberately don't call router.replace
    // because expo-router (SDK 54) internally invokes
    // SplashScreen.hideAsync() on group navigations, and expo-splash-screen
    // v31 throws "No native splash screen registered for given view
    // controller" when it fires on a VC that wasn't shown a splash.
  }, []);

  const handleLogout = useCallback(async () => {
    setLogoutSheetVisible(false);
    try {
      await signOut();
    } catch (err) {
      if (__DEV__) console.warn('Clerk signOut failed:', err);
    }
    try {
      await SecureStore.deleteItemAsync('__clerk_client_jwt');
    } catch (err) {
      if (__DEV__) console.warn('SecureStore cleanup failed:', err);
    }
    logout();
    router.replace('/auth');
  }, [signOut, logout, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>{userName} 👋</Text>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.avatarButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Menu profil"
          accessibilityHint="Ouvre le menu profil et déconnexion">
          <Image source={{ uri: user?.profile?.avatar || generateAvatarPlaceholder(userName, user?.id || 'default') }} style={styles.avatar} />
          {/* Indicateur du rôle / disponibilité */}
          <View
            style={[
              styles.roleIndicator,
              {
                backgroundColor: isChauffeur
                  ? isDisponible ? COLORS.success : COLORS.gray[400]
                  : isHebergeur
                  ? isDisponible ? COLORS.success : COLORS.gray[400]
                  : COLORS.primary,
              },
            ]}>
            <Ionicons
              name={isChauffeur ? 'car' : isHebergeur ? 'bed' : 'person'}
              size={10}
              color="white"
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal profil */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {/* Rôle actuel */}
            <View
              style={[
                styles.currentRole,
                {
                  borderColor: isChauffeur
                    ? isDisponible ? COLORS.success : COLORS.gray[400]
                    : isHebergeur
                    ? isDisponible ? COLORS.success : COLORS.gray[400]
                    : COLORS.primary,
                },
              ]}>
              <View
                style={[
                  styles.roleIcon,
                  {
                    backgroundColor: isChauffeur
                      ? isDisponible ? COLORS.success + '20' : COLORS.gray[100]
                      : isHebergeur
                      ? isDisponible ? COLORS.success + '20' : COLORS.gray[100]
                      : COLORS.primary + '20',
                  },
                ]}>
                <Ionicons
                  name={isChauffeur ? 'car' : isHebergeur ? 'bed' : 'person'}
                  size={24}
                  color={isChauffeur
                    ? isDisponible ? COLORS.success : COLORS.gray[400]
                    : isHebergeur
                    ? isDisponible ? COLORS.success : COLORS.gray[400]
                    : COLORS.primary}
                />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>
                  {isChauffeur ? 'Transporteur / Livreur' : isHebergeur ? 'Hébergeur' : 'Client'}
                </Text>
                <Text style={styles.roleSubtitle}>
                  {isChauffeur
                    ? isDisponible ? 'En ligne - Vous recevez des demandes' : 'Hors ligne'
                    : isHebergeur
                    ? isDisponible ? 'En ligne - Vos logements sont visibles' : 'Hors ligne'
                    : 'Commander des courses et livraisons'}
                </Text>
              </View>
              {(isChauffeur || isHebergeur) ? (
                <Switch
                  value={!!isDisponible}
                  onValueChange={setDisponible}
                  trackColor={{ false: '#D1D5DB', true: COLORS.success + '60' }}
                  thumbColor={isDisponible ? COLORS.success : '#F9FAFB'}
                />
              ) : (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </View>

            {/* Bouton de déconnexion / bascule de mode */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={openLogoutSheet}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                availableRoles.length > 1
                  ? 'Changer de mode ou se déconnecter'
                  : 'Se déconnecter'
              }>
              <View style={[styles.roleIcon, { backgroundColor: COLORS.error + '20' }]}>
                <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.logoutTitle}>
                  {availableRoles.length > 1 ? 'Changer de mode' : 'Se déconnecter'}
                </Text>
                <Text style={styles.roleSubtitle}>
                  {availableRoles.length > 1
                    ? 'Bascule sans te reconnecter'
                    : 'Quitter votre session'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <LogoutSheet
        visible={logoutSheetVisible}
        onClose={() => setLogoutSheetVisible(false)}
        currentRole={user?.role ?? 'client'}
        availableRoles={availableRoles}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
      />

      <ModeTransition
        visible={transitionRole !== null}
        role={transitionRole ?? 'client'}
        onComplete={handleTransitionComplete}
        quick
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 16,
    color: COLORS.gray[700],
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  avatarButton: {
    height: 48,
    width: 48,
    borderRadius: 24,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'white',
  },
  roleIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    height: 18,
    width: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 24,
    width: '100%',
    maxWidth: 340,
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.25)',
  },
  currentRole: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginBottom: 16,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  roleIcon: {
    height: 48,
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  roleSubtitle: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginTop: 8,
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});

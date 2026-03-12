import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '../../constants';
import { useAuthStore } from '../../stores/authStore';

interface HomeHeaderProps {
  userName: string;
}

export function HomeHeader({ userName }: HomeHeaderProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const { signOut } = useAuth();
  const { user, logout, setDisponible } = useAuthStore();
  const isChauffeur = user?.role === 'chauffeur';
  const isHebergeur = user?.role === 'hebergeur';
  const isDisponible = (isChauffeur || isHebergeur) && user?.profile && 'disponible' in user.profile && user.profile.disponible;

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          setModalVisible(false);
          // Déconnexion Clerk (session distante)
          await signOut();
          // Purge des tokens du SecureStore
          try {
            await SecureStore.deleteItemAsync('__clerk_client_jwt');
          } catch { /* ignore if key doesn't exist */ }
          // Déconnexion locale (store Zustand)
          logout();
          // Redirection vers la page de connexion
          router.replace('/auth');
        },
      },
    ]);
  };

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
          activeOpacity={0.8}>
          <Image source={{ uri: user?.profile?.avatar || 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face' }} style={styles.avatar} />
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

            {/* Bouton de déconnexion */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <View style={[styles.roleIcon, { backgroundColor: COLORS.error + '20' }]}>
                <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.logoutTitle}>Se déconnecter</Text>
                <Text style={styles.roleSubtitle}>Quitter votre session</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
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
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  currentRole: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
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

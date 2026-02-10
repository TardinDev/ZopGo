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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { userInfo } from '../../data';
import { COLORS } from '../../constants';
import { useAuthStore } from '../../stores/authStore';

interface HomeHeaderProps {
  userName: string;
}

export function HomeHeader({ userName }: HomeHeaderProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const { signOut } = useAuth();
  const { user, logout } = useAuthStore();
  const userRole = user?.role === 'chauffeur' ? 'driver' : 'client';

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
          <Image source={{ uri: userInfo.avatar }} style={styles.avatar} />
          {/* Indicateur du rôle actuel */}
          <View
            style={[
              styles.roleIndicator,
              { backgroundColor: userRole === 'client' ? COLORS.primary : COLORS.success },
            ]}>
            <Ionicons name={userRole === 'client' ? 'person' : 'car'} size={10} color="white" />
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
            <View style={styles.currentRole}>
              <View
                style={[
                  styles.roleIcon,
                  {
                    backgroundColor:
                      userRole === 'client' ? COLORS.primary + '20' : COLORS.success + '20',
                  },
                ]}>
                <Ionicons
                  name={userRole === 'client' ? 'person' : 'car'}
                  size={24}
                  color={userRole === 'client' ? COLORS.primary : COLORS.success}
                />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>
                  {userRole === 'client' ? 'Client' : 'Chauffeur / Livreur'}
                </Text>
                <Text style={styles.roleSubtitle}>
                  {userRole === 'client'
                    ? 'Commander des courses et livraisons'
                    : 'Accepter des courses et livraisons'}
                </Text>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={userRole === 'client' ? COLORS.primary : COLORS.success}
              />
            </View>

            {/* Bouton de déconnexion */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <View style={[styles.roleIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={24} color="#DC2626" />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.logoutTitle}>Se déconnecter</Text>
                <Text style={styles.roleSubtitle}>Quitter votre session</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
    color: '#374151',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
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
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
  },
  roleSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});

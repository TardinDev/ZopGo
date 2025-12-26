import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLivraisonsStore } from '../../stores';

export function LivraisonForm() {
  const { pickupLocation, dropoffLocation, setPickupLocation, setDropoffLocation, setShowResults } =
    useLivraisonsStore();

  const handleSearch = () => {
    if (pickupLocation && dropoffLocation) {
      setShowResults(true);
    }
  };

  const isDisabled = !pickupLocation || !dropoffLocation;

  return (
    <View style={styles.container}>
      {/* Card principale */}
      <View style={styles.card}>
        <Text style={styles.title}>Où souhaitez-vous envoyer votre colis ?</Text>

        {/* Lieu de récupération */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cube-outline" size={20} color="#2162FE" />
            </View>
            <Text style={styles.label}>Point de récupération</Text>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={24} color="#2162FE" />
            <TextInput
              style={styles.input}
              placeholder="Ex: Libreville, Glass"
              placeholderTextColor="#9CA3AF"
              value={pickupLocation}
              onChangeText={setPickupLocation}
            />
          </View>
        </View>

        {/* Bouton swap */}
        <View style={styles.swapContainer}>
          <View style={styles.swapButton}>
            <Ionicons name="swap-vertical" size={24} color="#F59E0B" />
          </View>
        </View>

        {/* Lieu de livraison */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.label}>Point de livraison</Text>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="flag" size={24} color="#10B981" />
            <TextInput
              style={styles.input}
              placeholder="Ex: Port-Gentil, Centre-ville"
              placeholderTextColor="#9CA3AF"
              value={dropoffLocation}
              onChangeText={setDropoffLocation}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#2162FE" />
            <Text style={styles.infoText}>
              Les livreurs les plus proches seront affichés en premier
            </Text>
          </View>
        </View>
      </View>

      {/* Bouton de recherche */}
      <TouchableOpacity
        onPress={handleSearch}
        disabled={isDisabled}
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        activeOpacity={0.9}>
        <LinearGradient
          colors={['#2162FE', '#1E40AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <View style={styles.buttonContent}>
            <Ionicons name="search" size={24} color="white" />
            <Text style={styles.buttonText}>Rechercher un livreur</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
    marginTop: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  swapContainer: {
    alignItems: 'center',
    marginTop: -12,
    marginBottom: -12,
    zIndex: 10,
  },
  swapButton: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  infoBox: {
    marginTop: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  button: {
    overflow: 'hidden',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
});

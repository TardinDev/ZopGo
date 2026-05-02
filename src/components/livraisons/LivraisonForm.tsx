import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useLivraisonsStore } from '../../stores';

export function LivraisonForm() {
  const {
    pickupLocation,
    dropoffLocation,
    packagePhoto,
    packageDescription,
    setPickupLocation,
    setDropoffLocation,
    setPackagePhoto,
    setPackageDescription,
    setShowResults,
  } = useLivraisonsStore();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Accès refusé',
        "Activez l'accès à la galerie dans les réglages pour ajouter une photo du colis."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setPackagePhoto(result.assets[0].uri);
    }
  };

  const handleSearch = () => {
    if (pickupLocation && dropoffLocation && packageDescription.trim()) {
      setShowResults(true);
    }
  };

  const isDisabled = !pickupLocation || !dropoffLocation || !packageDescription.trim();

  return (
    <View style={styles.container}>
      {/* Card principale */}
      <View style={styles.card}>
        {/* Section Colis */}
        <View style={styles.packageSection}>
          {/* Upload / Preview photo */}
          <TouchableOpacity
            style={styles.photoUpload}
            onPress={pickImage}
            activeOpacity={0.85}>
            {packagePhoto ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: packagePhoto }} style={styles.photoPreview} />
                <View style={styles.photoChangeBadge}>
                  <Ionicons name="camera-reverse" size={14} color="#FFFFFF" />
                  <Text style={styles.photoChangeText}>Changer</Text>
                </View>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="image-outline" size={26} color="#9CA3AF" />
                <Text style={styles.photoPlaceholderText}>Ajouter une photo du colis</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Description */}
          <View style={[styles.inputContainer, styles.descriptionContainer]}>
            <Ionicons name="document-text-outline" size={16} color="#6B7280" style={{ marginTop: 2 }} />
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description (ex: ce que contient votre colis, poids ?)"
              placeholderTextColor="#9CA3AF"
              value={packageDescription}
              onChangeText={setPackageDescription}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

        </View>

        {/* Lieu de récupération */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cube-outline" size={16} color="#2162FE" />
            </View>
            <Text style={styles.label}>Point de récupération</Text>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#2162FE" />
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
            <Ionicons name="swap-vertical" size={20} color="#F59E0B" />
          </View>
        </View>

        {/* Lieu de livraison */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            </View>
            <Text style={styles.label}>Point de livraison</Text>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="flag" size={20} color="#10B981" />
            <TextInput
              style={styles.input}
              placeholder="Ex: Port-Gentil, Centre-ville"
              placeholderTextColor="#9CA3AF"
              value={dropoffLocation}
              onChangeText={setDropoffLocation}
            />
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
            <Ionicons name="search" size={20} color="white" />
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
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 16,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.10)',
    marginBottom: 12,
  },
  packageSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  photoUpload: {
    marginTop: 0,
  },
  photoPlaceholder: {
    height: 150,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  photoPreviewContainer: {
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoChangeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  photoChangeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 10,
    marginTop: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    height: 30,
    width: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  descriptionContainer: {
    marginTop: 10,
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  descriptionInput: {
    fontSize: 12,
    minHeight: 30,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 15,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  swapContainer: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: -10,
    zIndex: 10,
  },
  swapButton: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 6,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.10)',
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  button: {
    overflow: 'hidden',
    borderRadius: 20,
    borderCurve: 'continuous',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.20)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
});

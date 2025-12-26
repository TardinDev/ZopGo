import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WaitingViewProps {
  livreur: any;
  pickupLocation: string;
  dropoffLocation: string;
}

export function WaitingView({ livreur, pickupLocation, dropoffLocation }: WaitingViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.spinnerWrapper}>
          <ActivityIndicator size="large" color="#2162FE" />
        </View>
        <Text style={styles.title}>En attente de confirmation</Text>
        <Text style={styles.subtitle}>
          Nous attendons que {livreur?.prenom} accepte votre demande...
        </Text>

        {/* Info livreur */}
        {livreur && (
          <View style={styles.livreurInfo}>
            <View style={styles.livreurRow}>
              <Image source={{ uri: livreur.photo }} style={styles.avatar} />
              <View style={styles.infoText}>
                <Text style={styles.name}>{livreur.prenom}</Text>
                <Text style={styles.vehicle}>{livreur.vehicule}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info trajet */}
        <View style={styles.tripInfo}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#2162FE" />
            <Text style={styles.locationText}>{pickupLocation}</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="flag" size={16} color="#10B981" />
            <Text style={styles.locationText}>{dropoffLocation}</Text>
          </View>
        </View>

        <Text style={styles.waitText}>Cela peut prendre quelques instants...</Text>
      </View>
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
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  spinnerWrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  livreurInfo: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  livreurRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    height: 56,
    width: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  vehicle: {
    color: '#4B5563',
    fontSize: 14,
  },
  tripInfo: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  waitText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
    textAlign: 'center',
  },
});

export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../../stores';
import { AnimatedTabScreen, EmptyState } from '../../../components/ui';
import {
  LocationHeader,
  LocationSearchBar,
  LocationFilters,
  VehicleCard,
} from '../../../components/location';

export default function LocationTab() {
  const { filteredVehicles = [] } = useLocationStore();

  return (
    <AnimatedTabScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <LinearGradient
          colors={['#000000', '#0A0A0A', '#000000']}
          locations={[0, 0.5, 1]}
          style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <LocationHeader />

            <LocationSearchBar />

            <LocationFilters />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {filteredVehicles?.length || 0} véhicule
                  {(filteredVehicles?.length || 0) > 1 ? 's' : ''}
                </Text>
              </View>

              {filteredVehicles && filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <View key={vehicle.id} style={{ paddingHorizontal: 20 }}>
                    <VehicleCard vehicle={vehicle} />
                  </View>
                ))
              ) : (
                <EmptyState
                  icon="car-sport-outline"
                  title="Les véhicules sont au garage..."
                  description="Essaie de modifier tes filtres pour les voir sortir."
                  iconSize={56}
                />
              )}

              <View style={{ height: 100 }} />
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </AnimatedTabScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

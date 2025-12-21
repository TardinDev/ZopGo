import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../../stores';
import {
    LocationHeader,
    LocationSearchBar,
    LocationFilters,
    VehicleCard,
} from '../../../components/location';

export default function LocationTab() {
    const { filteredVehicles = [] } = useLocationStore();

    // Gradient plus doux pour Location (vert menthe / blanc)
    const gradientColors = ['#ECFDF5', '#F9FAFB'] as const; // emerald-50 -> gray-50

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}>
            <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <LocationHeader />

                    <LocationSearchBar />

                    <LocationFilters />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}>

                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsCount}>
                                {filteredVehicles?.length || 0} véhicule{(filteredVehicles?.length || 0) > 1 ? 's' : ''} trouvé{(filteredVehicles?.length || 0) > 1 ? 's' : ''}
                            </Text>
                        </View>

                        {filteredVehicles && filteredVehicles.length > 0 ? (
                            filteredVehicles.map((vehicle) => (
                                <View key={vehicle.id} style={{ paddingHorizontal: 24 }}>
                                    <VehicleCard vehicle={vehicle} />
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                                <Text style={styles.emptySubtitle}>Essayez de modifier vos filtres</Text>
                            </View>
                        )}

                        {/* Spacer pour éviter que le dernier élément soit caché par la tab bar */}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 20,
    },
    resultsHeader: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    resultsCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
    }
});

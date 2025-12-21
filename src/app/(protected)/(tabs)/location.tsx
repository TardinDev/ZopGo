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

    return (
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
                            <View style={styles.resultsRow}>
                                <Text style={styles.resultsCount}>
                                    {filteredVehicles?.length || 0} véhicule{(filteredVehicles?.length || 0) > 1 ? 's' : ''}
                                </Text>
                                <View style={styles.sortButton}>
                                    <Ionicons name="swap-vertical" size={16} color="#2162FE" />
                                    <Text style={styles.sortText}>Trier</Text>
                                </View>
                            </View>
                        </View>

                        {filteredVehicles && filteredVehicles.length > 0 ? (
                            filteredVehicles.map((vehicle) => (
                                <View key={vehicle.id} style={{ paddingHorizontal: 20 }}>
                                    <VehicleCard vehicle={vehicle} />
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="car-sport-outline" size={48} color="#2162FE" />
                                </View>
                                <Text style={styles.emptyTitle}>Aucun véhicule trouvé</Text>
                                <Text style={styles.emptySubtitle}>Essayez de modifier vos filtres de recherche</Text>
                            </View>
                        )}

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
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    resultsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultsCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(33, 98, 254, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    sortText: {
        color: '#2162FE',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(33, 98, 254, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(33, 98, 254, 0.3)',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F1F5F9',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
});

import { View, Text, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * Top-of-screen banner that shows when network checks fail twice in a row.
 * Mounted globally in the root layout — every screen gets the same warning.
 */
export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  if (isConnected) return null;
  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 16 : 0,
        zIndex: 9998,
        elevation: 9998,
      }}>
      <Animated.View
        entering={FadeInDown.springify().damping(15)}
        exiting={FadeOutUp.duration(200)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFF7ED',
          borderColor: '#FED7AA',
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}>
        <Ionicons name="cloud-offline-outline" size={26} color="#EA580C" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: '#9A3412', fontSize: 14 }}>
            Pause connexion
          </Text>
          <Text style={{ color: '#7C2D12', fontSize: 13, marginTop: 2 }}>
            Hmm, ton téléphone semble hors ligne. On retente automatiquement.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

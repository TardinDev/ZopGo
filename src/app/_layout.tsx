import '../../global.css';

import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokenCache } from '../utils/tokenCache';

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Root layout aligned with expo-router expectations
export default function RootLayout() {
  // If no Clerk key, show error — the app cannot function without authentication
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#DC2626', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
          Configuration manquante
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>
          La clé EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY est absente du fichier .env
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ClerkLoaded>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <Stack initialRouteName="index" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="(protected)" options={{ contentStyle: { backgroundColor: '#fff' } }} />
            </Stack>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

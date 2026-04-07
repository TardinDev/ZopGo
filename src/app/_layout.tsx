import '../../global.css';

import { useEffect, useCallback } from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { tokenCache } from '../utils/tokenCache';
import ErrorBoundary from '../components/ErrorBoundary';

// Prevent splash from auto-hiding until the app is ready
SplashScreen.preventAutoHideAsync();

// En dev: utilise process.env, en prod: utilise Constants.expoConfig.extra
const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  Constants.expoConfig?.extra?.clerkPublishableKey;

function RootLayout() {
  const onLayoutReady = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

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
    <ErrorBoundary>
      <ClerkProvider tokenCache={tokenCache} publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ClerkLoaded>
          <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutReady}>
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
    </ErrorBoundary>
  );
}

export default RootLayout;

import '../../global.css';

import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokenCache } from '../utils/tokenCache';

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Root layout aligned with expo-router expectations
export default function RootLayout() {
  // Content without Clerk wrapper
  const appContent = (
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
  );

  // If Clerk key is available, wrap with ClerkProvider
  if (CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider tokenCache={tokenCache} publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ClerkLoaded>
          {appContent}
        </ClerkLoaded>
      </ClerkProvider>
    );
  }

  // If no Clerk key, run app without Clerk
  return appContent;
}

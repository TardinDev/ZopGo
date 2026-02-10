import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { TabAnimationProvider } from '../../hooks/useTabAnimation';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { user: localUser, setupProfile } = useAuthStore();

  // Synchroniser le profil Clerk -> Zustand si connecté mais pas de profil local
  // (ex: après redémarrage de l'app, Clerk garde la session mais Zustand est réinitialisé)
  useEffect(() => {
    if (isSignedIn && clerkUser && !localUser) {
      const name =
        clerkUser.fullName ||
        clerkUser.firstName ||
        clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] ||
        'Utilisateur';
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      setupProfile('client', name, email);
    }
  }, [isSignedIn, clerkUser, localUser, setupProfile]);

  // Attendre que Clerk soit chargé
  if (!isLoaded) return null;

  // Rediriger vers /auth si non connecté (Clerk OU profil local)
  if (!isSignedIn && !localUser) return <Redirect href="/auth" />;

  return (
    <TabAnimationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </TabAnimationProvider>
  );
}

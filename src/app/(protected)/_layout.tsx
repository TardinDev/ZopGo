import { useEffect, useRef, useCallback } from 'react';
import { Stack, Redirect, useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { TabAnimationProvider } from '../../hooks/useTabAnimation';
import { useAuthStore } from '../../stores/authStore';
import { setClerkTokenProvider } from '../../lib/supabase';
import { UserRole, VehicleType } from '../../types';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function ProtectedLayout() {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { user: localUser, setupProfile, logout } = useAuthStore();
  const router = useRouter();
  const backgroundTimestamp = useRef<number | null>(null);

  // Auto-logout after 15 min of inactivity (app in background)
  const handleAppStateChange = useCallback(
    (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimestamp.current = Date.now();
      } else if (nextState === 'active' && backgroundTimestamp.current) {
        const elapsed = Date.now() - backgroundTimestamp.current;
        backgroundTimestamp.current = null;
        if (elapsed >= INACTIVITY_TIMEOUT_MS && isSignedIn) {
          signOut().then(() => {
            logout();
            router.replace('/auth');
          });
        }
      }
    },
    [isSignedIn, signOut, logout, router]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  // Fournir le token Clerk à Supabase pour le RLS
  useEffect(() => {
    if (isSignedIn) {
      setClerkTokenProvider(() => getToken({ template: 'supabase' }));
    } else {
      setClerkTokenProvider(null);
    }
    return () => setClerkTokenProvider(null);
  }, [isSignedIn, getToken]);

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
      const metadata = clerkUser.unsafeMetadata as { role?: string; vehicleType?: string } | undefined;
      const role = (metadata?.role as UserRole) || 'client';
      const vehicleType = metadata?.vehicleType as VehicleType | undefined;
      setupProfile(role, name, email, role === 'chauffeur' ? vehicleType : undefined, clerkUser.id);
    }
  }, [isSignedIn, clerkUser, localUser, setupProfile]);

  // Attendre que Clerk soit chargé
  if (!isLoaded) return null;

  // Rediriger vers /auth si pas de session Clerk valide
  if (!isSignedIn) return <Redirect href="/auth" />;

  return (
    <TabAnimationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </TabAnimationProvider>
  );
}

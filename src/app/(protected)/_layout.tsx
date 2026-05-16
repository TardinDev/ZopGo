import { useEffect, useRef, useState, useCallback } from 'react';
import { Stack, Redirect, useRouter } from 'expo-router';
import { AppState, AppStateStatus, View } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { TabAnimationProvider } from '../../hooks/useTabAnimation';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAuthStore } from '../../stores/authStore';
import { setClerkTokenProvider } from '../../lib/supabase';
import { logError } from '../../utils/errorHandler';
import { GlobalRatingPrompt } from '../../components/ratings/GlobalRatingPrompt';
import { UserRole, VehicleType, AccommodationType } from '../../types';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function ProtectedLayout() {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { user: localUser, setupProfile, logout } = useAuthStore();
  const supabaseProfileId = useAuthStore((s) => s.supabaseProfileId);
  const router = useRouter();
  const backgroundTimestamp = useRef<number | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Register push notifications only after the Supabase JWT is injected AND
  // the profile row exists. updatePushToken does an UPDATE on profiles —
  // if the row hasn't been upserted yet (first login race), the update
  // matches zero rows and the token is silently lost. Gating on
  // supabaseProfileId guarantees the row is there.
  usePushNotifications(
    isSignedIn && supabaseReady && supabaseProfileId ? clerkUser?.id ?? null : null
  );

  // Auto-logout after 15 min of inactivity (app in background)
  const handleAppStateChange = useCallback(
    (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimestamp.current = Date.now();
      } else if (nextState === 'active' && backgroundTimestamp.current) {
        const elapsed = Date.now() - backgroundTimestamp.current;
        backgroundTimestamp.current = null;
        if (elapsed >= INACTIVITY_TIMEOUT_MS && isSignedIn) {
          signOut()
            .then(() => {
              logout();
              router.replace('/auth');
            })
            .catch((err) => {
              logError(err, 'auto-logout signOut');
              // Force local logout even if Clerk signOut fails
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

  // Fournir le token Clerk à Supabase pour le RLS.
  // supabaseReady gates push-notification registration so the token
  // update hits Supabase with a valid JWT (avoids silent RLS failure).
  useEffect(() => {
    if (isSignedIn) {
      setClerkTokenProvider(() => getToken());
      setSupabaseReady(true);
    } else {
      setClerkTokenProvider(null);
      setSupabaseReady(false);
    }
    return () => {
      setClerkTokenProvider(null);
      setSupabaseReady(false);
    };
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
      const metadata = clerkUser.unsafeMetadata as { role?: string; vehicleType?: string; accommodationType?: string } | undefined;
      const role = (metadata?.role as UserRole) || 'client';
      const vehicleType = metadata?.vehicleType as VehicleType | undefined;
      const accommodationType = metadata?.accommodationType as AccommodationType | undefined;
      setupProfile(role, name, email, role === 'chauffeur' ? vehicleType : undefined, clerkUser.id, role === 'hebergeur' ? accommodationType : undefined);
    }
  }, [isSignedIn, clerkUser, localUser, setupProfile]);

  // Attendre que Clerk soit chargé
  if (!isLoaded) return null;

  // Rediriger vers /auth si pas de session Clerk valide
  if (!isSignedIn) return <Redirect href="/auth" />;

  return (
    <TabAnimationProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <GlobalRatingPrompt />
      </View>
    </TabAnimationProvider>
  );
}

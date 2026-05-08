import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { logError } from '../utils/errorHandler';

// En dev: utilise process.env, en prod: utilise Constants.expoConfig.extra
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  '';

// Clerk JWT token provider — set by the protected layout
// Each Supabase request will call this to get a fresh token
let clerkTokenProvider: (() => Promise<string | null>) | null = null;

export function setClerkTokenProvider(provider: (() => Promise<string | null>) | null) {
  clerkTokenProvider = provider;
}

// When Supabase rejects the Clerk JWT (e.g. Third Party Auth misconfig in
// the Supabase Dashboard, issuer mismatch, or signing-key drift), PostgREST
// returns 401 with code PGRST301 and the app would otherwise see *every*
// request fail. For public-RLS reads (trajets, hebergements, profiles use
// `using(true)` / `using(deleted_at IS NULL)`) we transparently retry as
// anon so the client lists keep rendering. Writes still fail loudly — the
// real fix for those is to repair the TPA configuration.
let warnedTpaRejection = false;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (input, init = {}) => {
      // Inject Clerk JWT if available (enables RLS user-level policies)
      if (clerkTokenProvider) {
        try {
          const token = await clerkTokenProvider();
          if (token) {
            const headers = new Headers(init.headers);
            headers.set('Authorization', `Bearer ${token}`);
            const res = await fetch(input, { ...init, headers });
            if (res.status === 401) {
              try {
                const body = await res.clone().json();
                if (body?.code === 'PGRST301') {
                  if (!warnedTpaRejection) {
                    warnedTpaRejection = true;
                    console.warn(
                      '[supabase] Clerk JWT rejected by Supabase (PGRST301: ' +
                        (body?.message ?? 'JWT cryptographic operation failed') +
                        '). Falling back to anon for this request. ' +
                        'Verify Third Party Auth: Supabase Dashboard → Authentication → ' +
                        'Sign In / Providers → Clerk (issuer URL must match your Clerk instance).'
                    );
                  }
                  return fetch(input, init);
                }
              } catch {
                // body not JSON; surface original response
              }
            }
            return res;
          }
        } catch (err) {
          logError(err, 'Clerk token provider for Supabase');
        }
      }
      return fetch(input, init);
    },
  },
});

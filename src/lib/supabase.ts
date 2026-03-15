import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { logError } from '../utils/errorHandler';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Clerk JWT token provider — set by the protected layout
// Each Supabase request will call this to get a fresh token
let clerkTokenProvider: (() => Promise<string | null>) | null = null;

export function setClerkTokenProvider(provider: (() => Promise<string | null>) | null) {
  clerkTokenProvider = provider;
}

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
            return fetch(input, { ...init, headers });
          }
        } catch (err) {
          logError(err, 'Clerk token provider for Supabase');
        }
      }
      return fetch(input, init);
    },
  },
});

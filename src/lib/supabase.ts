import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

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
        } catch {
          // Fall through to default fetch with anon key
        }
      }
      return fetch(input, init);
    },
  },
});

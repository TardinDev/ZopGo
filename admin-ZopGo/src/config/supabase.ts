import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Clerk JWT token provider — set by the App component
 * Each Supabase request will call this to get a fresh token
 */
let clerkTokenProvider: (() => Promise<string | null>) | null = null;

export function setClerkTokenProvider(
    provider: (() => Promise<string | null>) | null
) {
    clerkTokenProvider = provider;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // Clerk manages sessions, not Supabase
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
    global: {
        fetch: async (input, init = {}) => {
            // Inject Clerk JWT if available (enables RLS policies for admin)
            if (clerkTokenProvider) {
                try {
                    const token = await clerkTokenProvider();
                    if (token) {
                        const headers = new Headers(init.headers);
                        headers.set("Authorization", `Bearer ${token}`);
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

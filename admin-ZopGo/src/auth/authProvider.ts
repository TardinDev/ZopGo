/**
 * ZopGo Admin — Refine AuthProvider adapté à Clerk
 * Utilise useAuth() / useUser() de @clerk/clerk-react
 */

import type { AuthProvider } from "@refinedev/core";

type ClerkAuthHook = {
    isSignedIn: boolean | undefined;
    isLoaded: boolean;
    signOut: () => Promise<void>;
    getToken: (options?: { template?: string }) => Promise<string | null>;
};

type ClerkUserHook = {
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        fullName: string | null;
        imageUrl: string;
        primaryEmailAddress?: { emailAddress: string } | null;
        publicMetadata: Record<string, unknown>;
    } | null | undefined;
    isLoaded: boolean;
};

/**
 * Creates a Refine AuthProvider from Clerk hooks.
 * Must be called inside a component that has ClerkProvider as ancestor.
 */
export function createAuthProvider(
    auth: ClerkAuthHook,
    user: ClerkUserHook
): AuthProvider {
    const adminRole = user.user?.publicMetadata?.role as string | undefined;
    const isAdmin = adminRole === "admin" || adminRole === "super_admin";

    return {
        login: async () => {
            // Clerk handles login via <SignIn /> component
            return { success: true };
        },

        logout: async () => {
            await auth.signOut();
            return { success: true, redirectTo: "/login" };
        },

        check: async () => {
            if (!auth.isLoaded || !user.isLoaded) {
                return { authenticated: false };
            }
            if (auth.isSignedIn && isAdmin) {
                return { authenticated: true };
            }
            if (auth.isSignedIn && !isAdmin) {
                // Signed in but not admin → show forbidden
                return {
                    authenticated: false,
                    error: {
                        name: "Accès refusé",
                        message:
                            "Vous n'avez pas les droits administrateur pour accéder à ce dashboard.",
                    },
                    redirectTo: "/login",
                };
            }
            return { authenticated: false, redirectTo: "/login" };
        },

        getPermissions: async () => {
            return adminRole ?? null;
        },

        getIdentity: async () => {
            if (!user.user) return null;
            return {
                id: user.user.id,
                name: user.user.fullName ?? user.user.firstName ?? "Admin",
                avatar: user.user.imageUrl,
                email: user.user.primaryEmailAddress?.emailAddress,
                role: adminRole,
            };
        },

        onError: async (error) => {
            if (error?.statusCode === 401 || error?.statusCode === 403) {
                return { logout: true, redirectTo: "/login" };
            }
            return { error };
        },
    };
}

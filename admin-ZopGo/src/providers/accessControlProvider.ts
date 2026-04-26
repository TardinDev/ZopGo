/**
 * ZopGo Admin — Refine AccessControlProvider
 * Un seul rôle admin avec accès complet. Toute autre identité est refusée.
 */

import type { AccessControlProvider } from "@refinedev/core";

export const accessControlProvider: AccessControlProvider = {
    can: async ({ params }) => {
        const role = params?.role as string | undefined;

        if (role === "admin") {
            return { can: true };
        }

        return {
            can: false,
            reason: "Accès réservé aux administrateurs.",
        };
    },

    options: {
        buttons: {
            enableAccessControl: true,
            hideIfUnauthorized: true,
        },
    },
};

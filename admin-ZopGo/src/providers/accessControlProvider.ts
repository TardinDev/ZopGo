/**
 * ZopGo Admin — Refine AccessControlProvider
 * RBAC : super_admin (tout) / admin (lecture + modification users)
 */

import type { AccessControlProvider } from "@refinedev/core";

export const accessControlProvider: AccessControlProvider = {
    can: async ({ resource, action, params }) => {
        const role = params?.role as string | undefined;

        // super_admin can do everything
        if (role === "super_admin") {
            return { can: true };
        }

        // admin can read all resources and update users
        if (role === "admin") {
            if (action === "list" || action === "show" || action === "field") {
                return { can: true };
            }
            if (resource === "profiles" && (action === "edit" || action === "create")) {
                return { can: true };
            }
            // Deny destructive actions on other resources
            if (action === "delete") {
                return {
                    can: false,
                    reason: "Seuls les super admins peuvent supprimer des enregistrements.",
                };
            }
            return { can: true };
        }

        // Non-admin roles: deny everything
        return {
            can: false,
            reason: "Vous n'avez pas les droits nécessaires.",
        };
    },

    options: {
        buttons: {
            enableAccessControl: true,
            hideIfUnauthorized: true,
        },
    },
};

/**
 * ZopGo Admin — Envoi de push notifications via Expo Push API
 *
 * Appelé après la création d'un admin_message pour notifier les utilisateurs
 * ciblés en plus de l'in-app message. Respecte les préférences user
 * (notification_preferences.messages).
 *
 * Pour MVP : appel direct depuis le navigateur (pas de clé Expo requise pour
 * envoyer vers des push tokens valides). À migrer vers une Edge Function
 * Supabase pour la prod si besoin de monitoring/quota/secret.
 */

import { supabase } from "@/config/supabase";
import type { AdminMessageTargetType, UserRole } from "@/types/enums";

const BATCH_SIZE = 100;

export interface SendAdminPushParams {
    messageId: string;
    targetType: AdminMessageTargetType;
    targetUserId?: string | null;
    targetRole?: UserRole | null;
    title: string;
    body: string;
}

export interface SendAdminPushResult {
    sent: number;
    failed: number;
    skipped: number;
}

interface ProfileRow {
    push_token: string | null;
    notification_preferences: { messages?: boolean } | null;
}

export async function sendAdminPush(
    params: SendAdminPushParams,
): Promise<SendAdminPushResult> {
    const { messageId, targetType, targetUserId, targetRole, title, body } = params;

    // 1. Récupère les push_tokens des cibles
    let query = supabase
        .from("profiles")
        .select("push_token, notification_preferences")
        .not("push_token", "is", null)
        .is("deleted_at", null);

    if (targetType === "user") {
        if (!targetUserId) throw new Error("target_user_id requis pour target_type=user");
        query = query.eq("id", targetUserId);
    } else if (targetType === "role") {
        if (!targetRole) throw new Error("target_role requis pour target_type=role");
        query = query.eq("role", targetRole);
    }
    // targetType === 'all' : pas de filtre supplémentaire

    const { data: profiles, error } = await query;
    if (error) throw error;

    const rows = (profiles ?? []) as ProfileRow[];
    const tokens = rows
        .filter(
            (p): p is ProfileRow & { push_token: string } =>
                Boolean(p.push_token) &&
                p.notification_preferences?.messages !== false,
        )
        .map((p) => p.push_token);

    const skipped = rows.length - tokens.length;

    if (tokens.length === 0) {
        await supabase
            .from("admin_messages")
            .update({ push_sent: true })
            .eq("id", messageId);
        return { sent: 0, failed: 0, skipped };
    }

    // 2. Envoi via l'Edge Function send-push
    //
    // Cette fonction envoyait auparavant directement vers l'API Expo Push.
    // Or AUCUN token de production n'est un token Expo: l'application obtient
    // des tokens FCM natifs via getDevicePushTokenAsync (voir
    // lib/pushRegistration.ts). Expo les rejetait donc tous, en repondant
    // malgre tout un HTTP 200 — les annonces etaient comptees comme envoyees
    // sans jamais atteindre le moindre telephone.
    //
    // send-push distingue les deux formats et route chacun vers le bon
    // service, avec les credentials Google cote serveur.
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        try {
            const { data, error } = await supabase.functions.invoke("send-push", {
                body: {
                    directTokens: batch,
                    title,
                    message: body,
                    category: "promotions",
                    skipInAppRecord: true,
                    data: { admin_message_id: messageId, type: "admin_message" },
                },
            });
            if (error) {
                failed += batch.length;
            } else {
                // send-push renvoie le nombre reellement accepte par le
                // service de notification, pas la taille du lot.
                const accepted = (data as { sent?: number } | null)?.sent ?? 0;
                sent += accepted;
                failed += batch.length - accepted;
            }
        } catch {
            failed += batch.length;
        }
    }

    // 3. Marque le message comme envoyé même si certaines pushs ont échoué
    // (in-app reste accessible via SELECT côté mobile)
    await supabase
        .from("admin_messages")
        .update({ push_sent: true })
        .eq("id", messageId);

    return { sent, failed, skipped };
}

import { supabase } from './supabase';
import type { AdminMessage, AdminMessageTargetType, UserRole } from '../types';

interface AdminMessageRow {
  id: string;
  sender_clerk_id: string;
  sender_name: string;
  target_type: AdminMessageTargetType;
  target_user_id: string | null;
  target_role: UserRole | null;
  title: string;
  body: string;
  push_sent: boolean;
  expires_at: string | null;
  created_at: string;
}

interface AdminMessageReadRow {
  message_id: string;
  read_at: string;
}

function mapRow(row: AdminMessageRow, readMap: Map<string, string>): AdminMessage {
  const readAt = readMap.get(row.id);
  return {
    id: row.id,
    senderName: row.sender_name,
    targetType: row.target_type,
    targetUserId: row.target_user_id,
    targetRole: row.target_role,
    title: row.title,
    body: row.body,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    isRead: !!readAt,
    readAt: readAt ?? null,
  };
}

/**
 * Récupère les annonces admin destinées à l'utilisateur courant.
 * Le filtrage par cible est fait par RLS côté DB (target_type='all',
 * role match, ou user match). On joint manuellement les reads.
 */
export async function fetchAdminMessages(profileId: string): Promise<AdminMessage[]> {
  const { data: messages, error } = await supabase
    .from('admin_messages')
    .select(
      'id, sender_clerk_id, sender_name, target_type, target_user_id, target_role, title, body, push_sent, expires_at, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (__DEV__) console.error('fetchAdminMessages error:', error.message);
    return [];
  }

  const rows = (messages ?? []) as AdminMessageRow[];
  if (rows.length === 0) return [];

  const messageIds = rows.map((m) => m.id);
  const { data: reads } = await supabase
    .from('admin_message_reads')
    .select('message_id, read_at')
    .eq('user_id', profileId)
    .in('message_id', messageIds);

  const readMap = new Map(
    ((reads ?? []) as AdminMessageReadRow[]).map((r) => [r.message_id, r.read_at])
  );

  return rows.map((row) => mapRow(row, readMap));
}

/**
 * Marque une annonce comme lue pour le user courant.
 * upsert pour éviter une erreur si déjà lue (PK composite (message_id, user_id)).
 */
export async function markAdminMessageAsRead(
  messageId: string,
  profileId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('admin_message_reads')
    .upsert(
      { message_id: messageId, user_id: profileId },
      { onConflict: 'message_id,user_id', ignoreDuplicates: true }
    );

  if (error) {
    if (__DEV__) console.error('markAdminMessageAsRead error:', error.message);
    return false;
  }
  return true;
}

/**
 * Compte les annonces non lues pour l'utilisateur courant.
 * Utile pour le badge dans le tab navigation.
 */
export async function countUnreadAdminMessages(profileId: string): Promise<number> {
  const messages = await fetchAdminMessages(profileId);
  return messages.filter((m) => !m.isRead).length;
}

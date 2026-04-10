import { supabase } from './supabase';
import { sendPushIfAllowed } from './pushNotifications';
import type { DirectMessage } from '../types';

interface SupabaseDirectMessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  reservation_id: string | null;
  content: string;
  read: boolean;
  created_at: string;
  sender?: { name: string; avatar: string } | null;
  receiver?: { name: string; avatar: string } | null;
}

export interface ConversationListItem {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  content: string;
  read: boolean;
  createdAt: string;
  reservationId?: string;
}

function mapRow(row: SupabaseDirectMessageRow): DirectMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    reservationId: row.reservation_id || undefined,
    content: row.content,
    read: row.read,
    createdAt: row.created_at,
  };
}

export async function sendDirectMessage(params: {
  senderId: string;
  receiverId: string;
  reservationId?: string;
  content: string;
}): Promise<DirectMessage | null> {
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: params.senderId,
      receiver_id: params.receiverId,
      reservation_id: params.reservationId || null,
      content: params.content,
    })
    .select('*, sender:sender_id(name)')
    .single();

  if (error) {
    if (__DEV__) console.error('sendDirectMessage error:', error.message);
    return null;
  }

  const row = data as SupabaseDirectMessageRow;
  const senderName = row.sender?.name || 'Nouveau message';
  const preview =
    params.content.length > 100
      ? params.content.slice(0, 97) + '...'
      : params.content;

  // Fire-and-forget push. `createInAppRecord: false` is CRITICAL: chat
  // unread is tracked in `direct_messages.read`, not in `notifications`.
  void sendPushIfAllowed({
    recipientProfileId: params.receiverId,
    category: 'messages',
    type: 'direct_message',
    title: senderName,
    body: preview,
    createInAppRecord: false,
    data: {
      type: 'direct_message',
      senderId: params.senderId,
      ...(params.reservationId && { reservationId: params.reservationId }),
    },
  });

  return mapRow(row);
}

export async function fetchConversation(
  userId: string,
  otherUserId: string,
  reservationId?: string
): Promise<DirectMessage[]> {
  let query = supabase
    .from('direct_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: true })
    .limit(200);

  if (reservationId) {
    query = query.eq('reservation_id', reservationId);
  }

  const { data, error } = await query;

  if (error) {
    if (__DEV__) console.error('fetchConversation error:', error.message);
    return [];
  }
  return ((data as SupabaseDirectMessageRow[]) || []).map(mapRow);
}

export async function fetchConversationsList(userId: string): Promise<ConversationListItem[]> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*, sender:sender_id(name, avatar), receiver:receiver_id(name, avatar)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('fetchConversationsList error:', error.message);
    return [];
  }

  const rows = (data as SupabaseDirectMessageRow[]) || [];
  const seen = new Set<string>();
  const result: ConversationListItem[] = [];

  for (const row of rows) {
    const isSender = row.sender_id === userId;
    const partnerId = isSender ? row.receiver_id : row.sender_id;
    const partner = isSender ? row.receiver : row.sender;

    if (seen.has(partnerId)) continue;
    seen.add(partnerId);

    result.push({
      id: row.id,
      partnerId,
      partnerName: partner?.name || 'Utilisateur',
      partnerAvatar: partner?.avatar || '',
      content: row.content,
      read: row.read,
      createdAt: row.created_at,
      reservationId: row.reservation_id || undefined,
    });
  }

  return result;
}

export async function markMessagesAsRead(receiverId: string, senderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('direct_messages')
    .update({ read: true })
    .eq('receiver_id', receiverId)
    .eq('sender_id', senderId)
    .eq('read', false);

  if (error) {
    if (__DEV__) console.error('markMessagesAsRead error:', error.message);
    return false;
  }
  return true;
}

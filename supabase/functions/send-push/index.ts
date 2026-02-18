import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN'); // optional

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type NotificationCategory = 'courses' | 'trajets' | 'promotions';

interface SendPushBody {
  recipientIds?: string[];
  recipientRole?: 'client' | 'chauffeur' | 'all';
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, string>;
}

function getCategoryMeta(category: NotificationCategory) {
  switch (category) {
    case 'courses':
      return { icon: 'car', iconColor: '#2162FE', iconBg: '#DBEAFE' };
    case 'trajets':
      return { icon: 'navigate', iconColor: '#10B981', iconBg: '#D1FAE5' };
    case 'promotions':
      return { icon: 'megaphone', iconColor: '#F59E0B', iconBg: '#FEF3C7' };
  }
}

async function sendExpoPush(tokens: string[], title: string, body: string, data: Record<string, string>) {
  const messages = tokens.map((to) => ({ to, title, body, sound: 'default' as const, data }));

  // Send in chunks of 100
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (EXPO_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${EXPO_ACCESS_TOKEN}`;
    }

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(chunk),
    });
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify service role auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: SendPushBody = await req.json();
    const { recipientIds, recipientRole, category, title, message, data } = body;

    if (!category || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: category, title, message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build query for profiles with push tokens
    let query = supabase
      .from('profiles')
      .select('clerk_id, push_token, notification_preferences')
      .not('push_token', 'is', null)
      .is('deleted_at', null);

    if (recipientIds && recipientIds.length > 0) {
      query = query.in('clerk_id', recipientIds);
    } else if (recipientRole && recipientRole !== 'all') {
      query = query.eq('role', recipientRole);
    }

    const { data: profiles, error: queryError } = await query;

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No eligible recipients found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Filter by notification preferences
    const eligible = profiles.filter((p) => {
      const prefs = p.notification_preferences as Record<string, boolean> | null;
      return !prefs || prefs[category] !== false;
    });

    const tokens = eligible.map((p) => p.push_token as string);
    const meta = getCategoryMeta(category);

    // Send push notifications
    if (tokens.length > 0) {
      await sendExpoPush(tokens, title, message, {
        category,
        icon: meta.icon,
        iconColor: meta.iconColor,
        iconBg: meta.iconBg,
        ...data,
      });
    }

    // Insert in-app notification records
    const recipientClerkIds = eligible.map((p) => p.clerk_id);
    const notificationRecords = recipientClerkIds.map((clerkId) => ({
      type: category,
      title,
      message,
      icon: meta.icon,
      icon_color: meta.iconColor,
      icon_bg: meta.iconBg,
      recipient_id: clerkId,
      recipient_role: recipientRole || null,
      read: false,
    }));

    // Insert in batches of 500
    for (let i = 0; i < notificationRecords.length; i += 500) {
      const batch = notificationRecords.slice(i, i + 500);
      await supabase.from('notifications').insert(batch);
    }

    return new Response(
      JSON.stringify({ sent: tokens.length, inApp: recipientClerkIds.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

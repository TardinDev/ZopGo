import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN'); // optional
const GOOGLE_SERVICE_ACCOUNT = Deno.env.get('GOOGLE_SERVICE_ACCOUNT'); // required for FCM

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationCategory =
  | 'courses'
  | 'trajets'
  | 'hebergements'
  | 'promotions'
  | 'messages';

interface SendPushBody {
  // Existing: profile / role targeting
  recipientIds?: string[];
  recipientProfileIds?: string[];
  recipientRole?: 'client' | 'chauffeur' | 'hebergeur' | 'all';
  // New: direct token sending (caller already has the token)
  directTokens?: string[];
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, string>;
  skipInAppRecord?: boolean;
}

// ---------------------------------------------------------------------------
// Category metadata (icons + colours)
// ---------------------------------------------------------------------------

function getCategoryMeta(category: NotificationCategory) {
  switch (category) {
    case 'courses':
      return { icon: 'car', iconColor: '#2162FE', iconBg: '#DBEAFE' };
    case 'trajets':
      return { icon: 'navigate', iconColor: '#10B981', iconBg: '#D1FAE5' };
    case 'hebergements':
      return { icon: 'bed', iconColor: '#8B5CF6', iconBg: '#EDE9FE' };
    case 'promotions':
      return { icon: 'megaphone', iconColor: '#F59E0B', iconBg: '#FEF3C7' };
    case 'messages':
      return { icon: 'chatbubble', iconColor: '#2162FE', iconBg: '#DBEAFE' };
  }
}

// ---------------------------------------------------------------------------
// Token type detection
// ---------------------------------------------------------------------------

function isExpoToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[');
}

// ---------------------------------------------------------------------------
// Base64url encoding (needed for JWT creation)
// ---------------------------------------------------------------------------

function base64url(input: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < input.length; i++) {
    binary += String.fromCharCode(input[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlString(str: string): string {
  return base64url(new TextEncoder().encode(str));
}

// ---------------------------------------------------------------------------
// Google OAuth2 access token via service account JWT (for FCM v1 API)
// ---------------------------------------------------------------------------

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getGoogleAccessToken(): Promise<string | null> {
  // Return cached token if still valid (5 min buffer)
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 300_000) {
    return cachedAccessToken.token;
  }

  if (!GOOGLE_SERVICE_ACCOUNT) {
    console.error('[FCM] GOOGLE_SERVICE_ACCOUNT secret not set');
    return null;
  }

  try {
    const sa = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
    const now = Math.floor(Date.now() / 1000);

    // Build JWT
    const header = base64urlString(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64urlString(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })
    );
    const signingInput = `${header}.${payload}`;

    // Import RSA private key from PEM
    const pemContent = sa.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');
    const keyBytes = Uint8Array.from(atob(pemContent), (c: string) =>
      c.charCodeAt(0)
    );

    const key = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );

    // Sign
    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(signingInput)
    );
    const jwt = `${signingInput}.${base64url(new Uint8Array(signatureBuffer))}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[FCM] OAuth2 token exchange failed:', tokenRes.status, errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    cachedAccessToken = {
      token: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
    };
    return tokenData.access_token;
  } catch (err) {
    console.error('[FCM] getGoogleAccessToken error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// FCM v1 API — send to individual device tokens
// ---------------------------------------------------------------------------

async function sendFcmPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
  accessToken: string,
  projectId: string
): Promise<{ sent: number; errors: string[] }> {
  let sent = 0;
  const errors: string[] = [];

  for (const token of tokens) {
    try {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data,
              android: {
                priority: 'high',
                notification: {
                  channel_id: 'default',
                  sound: 'default',
                  color: '#2162FE',
                },
              },
            },
          }),
        }
      );

      if (res.ok) {
        sent++;
      } else {
        const errBody = await res.text();
        console.error(
          `[FCM] send failed (${res.status}) token=${token.substring(0, 20)}…:`,
          errBody.substring(0, 300)
        );
        errors.push(`${res.status}: ${errBody.substring(0, 200)}`);
      }
    } catch (err) {
      const msg = (err as Error).message;
      console.error('[FCM] send error:', msg);
      errors.push(msg);
    }
  }

  return { sent, errors };
}

// ---------------------------------------------------------------------------
// Expo Push API — for backward compatibility with ExponentPushToken[…] tokens
// ---------------------------------------------------------------------------

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ sent: number; errors: string[] }> {
  const messages = tokens.map((to) => ({
    to,
    title,
    body,
    sound: 'default' as const,
    priority: 'high' as const,
    channelId: 'default',
    data,
  }));

  let sent = 0;
  const errors: string[] = [];

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (EXPO_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${EXPO_ACCESS_TOKEN}`;
    }

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(chunk),
      });

      if (res.ok) {
        try {
          const result = await res.json();
          const tickets = Array.isArray(result?.data) ? result.data : [];
          for (const ticket of tickets) {
            if (ticket?.status === 'ok') {
              sent++;
            } else {
              const errMsg = ticket?.message || 'unknown';
              errors.push(errMsg);
              console.error('[Expo] ticket error:', errMsg, ticket?.details);
            }
          }
          // If we couldn't parse individual tickets, count the whole chunk
          if (tickets.length === 0) sent += chunk.length;
        } catch {
          sent += chunk.length;
        }
      } else {
        errors.push(`Expo HTTP ${res.status}`);
        console.error('[Expo] HTTP error:', res.status);
      }
    } catch (err) {
      const msg = (err as Error).message;
      errors.push(msg);
      console.error('[Expo] send error:', msg);
    }
  }

  return { sent, errors };
}

// ---------------------------------------------------------------------------
// Unified sender — routes each token to the right API
// ---------------------------------------------------------------------------

async function sendToTokens(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ sent: number; errors: string[] }> {
  const expoTokens = tokens.filter(isExpoToken);
  const fcmTokens = tokens.filter((t) => !isExpoToken(t));

  let totalSent = 0;
  const allErrors: string[] = [];

  // Expo tokens → Expo Push API
  if (expoTokens.length > 0) {
    const r = await sendExpoPush(expoTokens, title, body, data);
    totalSent += r.sent;
    allErrors.push(...r.errors);
  }

  // FCM tokens → FCM v1 API
  if (fcmTokens.length > 0) {
    const accessToken = await getGoogleAccessToken();
    if (accessToken) {
      // Extract project ID from service account
      let projectId = 'zopgo-ca85d';
      try {
        const sa = JSON.parse(GOOGLE_SERVICE_ACCOUNT!);
        projectId = sa.project_id || projectId;
      } catch { /* use default */ }

      const r = await sendFcmPush(fcmTokens, title, body, data, accessToken, projectId);
      totalSent += r.sent;
      allErrors.push(...r.errors);
    } else {
      allErrors.push(
        'GOOGLE_SERVICE_ACCOUNT not configured — cannot deliver to FCM tokens'
      );
    }
  }

  return { sent: totalSent, errors: allErrors };
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: SendPushBody = await req.json();
    const {
      recipientIds,
      recipientProfileIds,
      recipientRole,
      directTokens,
      category,
      title,
      message,
      data,
      skipInAppRecord,
    } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const meta = getCategoryMeta(category || 'messages');
    const pushData: Record<string, string> = {
      category: category || 'messages',
      icon: meta.icon,
      iconColor: meta.iconColor,
      iconBg: meta.iconBg,
      ...data,
    };

    // ----- Path A: Direct token sending (caller already has the tokens) ----
    if (directTokens && directTokens.length > 0) {
      const result = await sendToTokens(directTokens, title, message, pushData);
      return new Response(
        JSON.stringify({
          sent: result.sent,
          errors: result.errors.length > 0 ? result.errors : undefined,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ----- Path B: Profile-based sending (existing logic) ------------------
    let query = supabase
      .from('profiles')
      .select('id, clerk_id, push_token, notification_preferences')
      .not('push_token', 'is', null)
      .is('deleted_at', null);

    if (recipientProfileIds && recipientProfileIds.length > 0) {
      query = query.in('id', recipientProfileIds);
    } else if (recipientIds && recipientIds.length > 0) {
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

    // Filter by notification preferences (missing pref = opt-in)
    const eligible = profiles.filter((p) => {
      const prefs = p.notification_preferences as Record<string, boolean> | null;
      return !prefs || prefs[category] !== false;
    });

    const tokens = eligible
      .map((p) => p.push_token as string | null)
      .filter((t): t is string => !!t);

    // Send push notifications
    let pushResult = { sent: 0, errors: [] as string[] };
    if (tokens.length > 0) {
      pushResult = await sendToTokens(tokens, title, message, pushData);
    }

    // Insert in-app notification records
    let inAppInserted = 0;
    if (!skipInAppRecord) {
      const notificationRecords = eligible
        .filter((p) => !!p.id)
        .map((p) => ({
          type: category,
          title,
          message,
          icon: meta.icon,
          icon_color: meta.iconColor,
          icon_bg: meta.iconBg,
          recipient_id: p.id as string,
          recipient_role: recipientRole || null,
          read: false,
        }));

      for (let i = 0; i < notificationRecords.length; i += 500) {
        const batch = notificationRecords.slice(i, i + 500);
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(batch);
        if (!insertError) {
          inAppInserted += batch.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        sent: pushResult.sent,
        inApp: inAppInserted,
        errors: pushResult.errors.length > 0 ? pushResult.errors : undefined,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-push] handler error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

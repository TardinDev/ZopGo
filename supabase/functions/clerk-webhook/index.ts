import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CLERK_WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyWebhook(
  req: Request
): Promise<{ valid: boolean; body: string }> {
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { valid: false, body: '' };
  }

  const body = await req.text();

  // Verify timestamp is within 5 minutes
  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return { valid: false, body };
  }

  // Verify signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;

  // Clerk webhook secret starts with "whsec_", remove prefix and decode base64
  const secretBytes = Uint8Array.from(
    atob(CLERK_WEBHOOK_SECRET.replace('whsec_', '')),
    (c) => c.charCodeAt(0)
  );

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedContent)
  );

  const computedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  );

  // svix-signature can contain multiple signatures separated by spaces
  const signatures = svixSignature.split(' ');
  const isValid = signatures.some((sig) => {
    const [, sigValue] = sig.split(',');
    return sigValue === computedSignature;
  });

  return { valid: isValid, body };
}

async function logAudit(
  tableName: string,
  recordId: string,
  action: string,
  oldData: unknown,
  newData: unknown,
  performedBy: string
) {
  await supabase.from('audit_log').insert({
    table_name: tableName,
    record_id: recordId,
    action,
    old_data: oldData,
    new_data: newData,
    performed_by: performedBy,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { valid, body } = await verifyWebhook(req);
  if (!valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);
  const eventType = event.type as string;
  const userData = event.data;

  try {
    switch (eventType) {
      case 'user.created': {
        const clerkId = userData.id;
        const email =
          userData.email_addresses?.[0]?.email_address || '';
        const name =
          userData.first_name ||
          email.split('@')[0] ||
          'Utilisateur';
        const role = userData.unsafe_metadata?.role || 'client';

        const { data } = await supabase
          .from('profiles')
          .upsert(
            {
              clerk_id: clerkId,
              name,
              email,
              role,
              disponible: role === 'chauffeur',
            },
            { onConflict: 'clerk_id' }
          )
          .select()
          .single();

        await logAudit(
          'profiles',
          data?.id || clerkId,
          'INSERT',
          null,
          data,
          'clerk-webhook'
        );
        break;
      }

      case 'user.updated': {
        const clerkId = userData.id;
        const email =
          userData.email_addresses?.[0]?.email_address || '';
        const name =
          userData.first_name ||
          email.split('@')[0] ||
          'Utilisateur';

        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('clerk_id', clerkId)
          .single();

        const { data } = await supabase
          .from('profiles')
          .update({ name, email })
          .eq('clerk_id', clerkId)
          .select()
          .single();

        await logAudit(
          'profiles',
          data?.id || clerkId,
          'UPDATE',
          existing,
          data,
          'clerk-webhook'
        );
        break;
      }

      case 'user.deleted': {
        const clerkId = userData.id;

        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('clerk_id', clerkId)
          .single();

        // Soft delete
        await supabase
          .from('profiles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('clerk_id', clerkId);

        await logAudit(
          'profiles',
          existing?.id || clerkId,
          'DELETE',
          existing,
          null,
          'clerk-webhook'
        );
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

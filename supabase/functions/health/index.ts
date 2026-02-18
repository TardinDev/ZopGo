import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async () => {
  const start = Date.now();

  try {
    const { error } = await supabase.rpc('', {}).maybeSingle();

    // Fallback: simple query to check DB connectivity
    const { error: queryError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const latencyMs = Date.now() - start;

    if (queryError) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: queryError.message,
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'ok',
        latency_ms: latencyMs,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const latencyMs = Date.now() - start;
    return new Response(
      JSON.stringify({
        status: 'error',
        error: (err as Error).message,
        latency_ms: latencyMs,
        timestamp: new Date().toISOString(),
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Tests the PGRST301 fallback in src/lib/supabase.ts. The supabase client
// is normally mocked in jest.setup — we unmock it here so the real fetch
// wrapper runs against a stub global.fetch.

jest.unmock('../supabase');

// Make sure the supabase-js call inside src/lib/supabase.ts uses a stub
// createClient that just exposes the fetch we pass in.
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((_url: string, _key: string, opts: { global: { fetch: typeof fetch } }) => ({
    __fetch: opts.global.fetch,
  })),
}));

// Avoid pulling in @react-native-async-storage at top level
jest.mock('@react-native-async-storage/async-storage', () => ({}));

// silence unrelated url-polyfill
jest.mock('react-native-url-polyfill/auto', () => ({}));

interface SupabaseStub {
  __fetch: typeof fetch;
}

const realFetch = global.fetch;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  global.fetch = realFetch;
});

function importSupabase(): { supabase: SupabaseStub; setClerkTokenProvider: (p: (() => Promise<string | null>) | null) => void } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../supabase');
}

describe('supabase fetch wrapper — no Clerk token', () => {
  it('passes through to global.fetch when no provider is set', async () => {
    const fakeRes = new Response('[]', { status: 200 });
    global.fetch = jest.fn().mockResolvedValueOnce(fakeRes);

    const { supabase, setClerkTokenProvider } = importSupabase();
    setClerkTokenProvider(null);

    const res = await supabase.__fetch('https://x/rest/v1/profiles', {});

    expect(res).toBe(fakeRes);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('supabase fetch wrapper — Clerk token attached', () => {
  it('sets Authorization: Bearer <token> on the request', async () => {
    const fakeRes = new Response('[]', { status: 200 });
    global.fetch = jest.fn().mockResolvedValueOnce(fakeRes);

    const { supabase, setClerkTokenProvider } = importSupabase();
    setClerkTokenProvider(async () => 'jwt-token-abc');

    await supabase.__fetch('https://x/rest/v1/profiles', {});

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const init = call[1];
    const auth = (init.headers as Headers).get('Authorization');
    expect(auth).toBe('Bearer jwt-token-abc');
  });

  it('falls back to anon retry on PGRST301', async () => {
    const body = JSON.stringify({ code: 'PGRST301', message: 'jwt rejected' });
    const tpaReject = new Response(body, { status: 401 });
    const anonOk = new Response('[]', { status: 200 });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(tpaReject)
      .mockResolvedValueOnce(anonOk);

    const { supabase, setClerkTokenProvider } = importSupabase();
    setClerkTokenProvider(async () => 'jwt-bad');

    const res = await supabase.__fetch('https://x/rest/v1/trajets', {});
    expect(res).toBe(anonOk);
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Second call must NOT carry Authorization (anon retry).
    const secondInit = (global.fetch as jest.Mock).mock.calls[1][1];
    if (secondInit?.headers) {
      const auth = (secondInit.headers as Headers).get?.('Authorization');
      expect(auth).toBeFalsy();
    }
  });

  it('warns once per session on PGRST301 (subsequent rejections stay silent)', async () => {
    const body = JSON.stringify({ code: 'PGRST301', message: 'x' });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(body, { status: 401 })) // 1st: rejected
      .mockResolvedValueOnce(new Response('[]', { status: 200 })) // 1st anon fallback
      .mockResolvedValueOnce(new Response(body, { status: 401 })) // 2nd: rejected
      .mockResolvedValueOnce(new Response('[]', { status: 200 })); // 2nd anon fallback

    const { supabase, setClerkTokenProvider } = importSupabase();
    setClerkTokenProvider(async () => 'jwt-bad');

    await supabase.__fetch('https://x/rest/v1/trajets', {});
    await supabase.__fetch('https://x/rest/v1/hebergements', {});

    // Single warn for the whole session
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as jest.Mock).mock.calls[0][0]).toContain('PGRST301');
  });

  it('does NOT fall back when the 401 is not PGRST301 (e.g. real RLS denial)', async () => {
    const body = JSON.stringify({ code: '42501', message: 'permission denied' });
    const denied = new Response(body, { status: 401 });
    global.fetch = jest.fn().mockResolvedValueOnce(denied);

    const { supabase, setClerkTokenProvider } = importSupabase();
    setClerkTokenProvider(async () => 'jwt-good');

    const res = await supabase.__fetch('https://x/rest/v1/profiles', {});
    expect(res).toBe(denied);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT fall back when status is not 401 (e.g. 200 / 500)', async () => {
    const ok = new Response('[]', { status: 200 });
    global.fetch = jest.fn().mockResolvedValueOnce(ok);

    const { supabase, setClerkTokenProvider } = importSupabase();
    setClerkTokenProvider(async () => 'jwt-good');

    const res = await supabase.__fetch('https://x/rest/v1/profiles', {});
    expect(res).toBe(ok);
  });

  it('survives non-JSON body in a 401 (no fallback, surface original)', async () => {
    const html = new Response('<html>upstream error</html>', { status: 401 });
    global.fetch = jest.fn().mockResolvedValueOnce(html);

    const { supabase, setClerkTokenProvider } = importSupabase();
    setClerkTokenProvider(async () => 'jwt-good');

    const res = await supabase.__fetch('https://x/rest/v1/profiles', {});
    expect(res).toBe(html);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

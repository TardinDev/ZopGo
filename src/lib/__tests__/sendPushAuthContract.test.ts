/**
 * Regression guard for the silent push-notification outage.
 *
 * Root cause: `send-push` was deployed with `verify_jwt = true`. The Edge
 * gateway validates Bearer tokens against Supabase's own asymmetric keys and
 * rejects Clerk Third-Party Auth session tokens with
 * `UNAUTHORIZED_ASYMMETRIC_JWT`, so every push from a real device was dropped
 * with 401 before reaching the handler. PostgREST accepted the very same
 * token, which is why in-app notification rows were written while no push ever
 * arrived. All production push tokens are raw FCM tokens, so 100% of pushes
 * routed through this function and 100% of them failed.
 *
 * The fix moves authentication off the gateway and into the function. That
 * makes the two settings a matched pair: turning the gateway off is only safe
 * while the function verifies the Clerk signature itself. This function holds
 * the service role key and can fan out to every user, so if these ever drift
 * apart it becomes an open push-spam relay.
 *
 * These tests assert the pair stays in sync. They read the deployed sources
 * directly because the behaviour lives in Deno code that the app's Jest
 * environment cannot import.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const configToml = readFileSync(join(REPO_ROOT, 'supabase', 'config.toml'), 'utf8');
const sendPushSource = readFileSync(
  join(REPO_ROOT, 'supabase', 'functions', 'send-push', 'index.ts'),
  'utf8'
);

/** Strips comment lines so assertions never match commented-out config. */
function activeLines(toml: string): string[] {
  return toml
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

/** Returns the key/value lines belonging to a `[section]` header. */
function tomlSection(toml: string, section: string): string[] {
  const lines = activeLines(toml);
  const start = lines.indexOf(`[${section}]`);
  if (start === -1) return [];

  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('[')) break;
    body.push(line);
  }
  return body;
}

describe('send-push edge function auth contract', () => {
  it('disables gateway JWT verification, which rejects Clerk TPA tokens', () => {
    const section = tomlSection(configToml, 'functions.send-push');

    expect(section).toContain('verify_jwt = false');
  });

  it('verifies the Clerk token signature inside the function', () => {
    // Signature verification, not just decoding: a decoded claim is forgeable.
    expect(sendPushSource).toMatch(/jwtVerify/);
    expect(sendPushSource).toMatch(/createRemoteJWKSet/);
    expect(sendPushSource).toMatch(/authenticateCaller/);
  });

  it('pins verification to the configured Clerk issuer', () => {
    // Without an issuer check, any validly-signed JWT from any issuer passes.
    expect(sendPushSource).toMatch(/CLERK_ISSUER/);
    expect(sendPushSource).toMatch(/issuer:\s*CLERK_ISSUER/);
  });

  it('rejects the request when the caller cannot be authenticated', () => {
    expect(sendPushSource).toMatch(
      /const callerId = await authenticateCaller\(req\)/
    );
    expect(sendPushSource).toMatch(/if \(!callerId\)/);
  });

  it('never trusts mere presence of a Bearer header as authentication', () => {
    // The pre-fix handler did exactly this and relied on the gateway for the
    // real check — the assumption that silently broke under Clerk TPA.
    const presenceOnlyCheck =
      /if\s*\(\s*!authHeader\?\.startsWith\('Bearer '\)\s*\)\s*\{\s*return new Response/;

    expect(sendPushSource).not.toMatch(presenceOnlyCheck);
  });
});

// Regression: ISSUE-002 — sur web, le ping de connectivité vers la racine
// Supabase était bloqué par CORS → fetch rejeté → fausse bannière "hors
// ligne" et checkNetwork() bloquait toutes les actions des stores.
// Le fix passe mode:'no-cors' sur web uniquement (réponse opaque, mais le
// fetch aboutit dès que le réseau répond) ; le natif reste sans mode.
// Found by /qa on 2026-07-08

import { Platform } from 'react-native';
import { checkNetwork } from '../useNetworkStatus';

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockReset();
});

describe('checkNetwork — CORS reachability (ISSUE-002)', () => {
  it('passes mode no-cors on web so the CORS-less Supabase root does not reject', async () => {
    const osSpy = jest.replaceProperty(Platform, 'OS', 'web');
    (global.fetch as jest.Mock).mockResolvedValue({ type: 'opaque' });

    await checkNetwork();

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toMatchObject({ method: 'HEAD', mode: 'no-cors' });
    osSpy.restore();
  });

  it('does not pass mode on native platforms (RN fetch has no CORS)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await checkNetwork();

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].mode).toBeUndefined();
  });

  it('still reports offline when the fetch genuinely fails on web (DNS/timeout)', async () => {
    const osSpy = jest.replaceProperty(Platform, 'OS', 'web');
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(checkNetwork()).resolves.toBe(false);
    osSpy.restore();
  });
});

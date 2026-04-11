import { checkNetwork } from '../useNetworkStatus';

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockReset();
});

describe('checkNetwork', () => {
  it('returns true when fetch succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    const result = await checkNetwork();
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns true when fetch returns non-ok status (server is reachable)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });
    const result = await checkNetwork();
    expect(result).toBe(true);
  });

  it('returns false when fetch throws (network error)', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));
    const result = await checkNetwork();
    expect(result).toBe(false);
  });

  it('uses HEAD method with AbortController signal', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    await checkNetwork();
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toMatchObject({ method: 'HEAD', cache: 'no-store' });
    expect(callArgs[1].signal).toBeDefined();
  });
});

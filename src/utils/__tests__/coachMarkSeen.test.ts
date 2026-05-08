import AsyncStorage from '@react-native-async-storage/async-storage';
import { shouldShowCoachMark, markCoachMarkSeen } from '../coachMarkSeen';

const TRAJET_KEY = 'zopgo:coachmark-trajet-seen';
const HEBERGEMENT_KEY = 'zopgo:coachmark-hebergement-seen';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('shouldShowCoachMark', () => {
  it('returns true when no flag has been written yet for this kind', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await expect(shouldShowCoachMark('trajet')).resolves.toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(TRAJET_KEY);
  });

  it('returns false once the flag is set', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('2026-05-08T10:00:00.000Z');
    await expect(shouldShowCoachMark('trajet')).resolves.toBe(false);
  });

  it('uses different keys for trajet vs hebergement', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await shouldShowCoachMark('trajet');
    await shouldShowCoachMark('hebergement');
    expect(AsyncStorage.getItem).toHaveBeenNthCalledWith(1, TRAJET_KEY);
    expect(AsyncStorage.getItem).toHaveBeenNthCalledWith(2, HEBERGEMENT_KEY);
  });

  it('resolves false (does not crash) when AsyncStorage rejects', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage offline'));
    await expect(shouldShowCoachMark('trajet')).resolves.toBe(false);
  });

  it('does not call setItem — read-only check', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await shouldShowCoachMark('trajet');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('markCoachMarkSeen', () => {
  it('writes the flag with an ISO timestamp under the kind-specific key', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
    await markCoachMarkSeen('hebergement');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(HEBERGEMENT_KEY, expect.any(String));
    const stored = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    expect(() => new Date(stored).toISOString()).not.toThrow();
  });

  it('swallows AsyncStorage write errors so the UI flow is never blocked', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('No space left'));
    await expect(markCoachMarkSeen('trajet')).resolves.toBeUndefined();
  });
});

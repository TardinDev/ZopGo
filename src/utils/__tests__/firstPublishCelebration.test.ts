import AsyncStorage from '@react-native-async-storage/async-storage';
import { shouldCelebrateFirstPublish } from '../firstPublishCelebration';

const TRAJET_KEY = 'zopgo:first-trajet-celebrated';
const HEBERGEMENT_KEY = 'zopgo:first-hebergement-celebrated';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('shouldCelebrateFirstPublish', () => {
  it('returns true and writes the flag the first time for a kind', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await shouldCelebrateFirstPublish('trajet');

    expect(result).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(TRAJET_KEY);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(TRAJET_KEY, expect.any(String));
    // Stored value should be parseable as an ISO timestamp
    const storedValue = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    expect(() => new Date(storedValue).toISOString()).not.toThrow();
  });

  it('returns false on subsequent calls (flag already present)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('2026-05-08T10:00:00.000Z');

    const result = await shouldCelebrateFirstPublish('trajet');

    expect(result).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('uses separate keys per kind so trajet and hebergement celebrate independently', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null) // trajet first call
      .mockResolvedValueOnce(null); // hebergement first call
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const trajetResult = await shouldCelebrateFirstPublish('trajet');
    const hebergementResult = await shouldCelebrateFirstPublish('hebergement');

    expect(trajetResult).toBe(true);
    expect(hebergementResult).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenNthCalledWith(1, TRAJET_KEY);
    expect(AsyncStorage.getItem).toHaveBeenNthCalledWith(2, HEBERGEMENT_KEY);
    expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(1, TRAJET_KEY, expect.any(String));
    expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(2, HEBERGEMENT_KEY, expect.any(String));
  });

  it('returns false (and does not throw) when AsyncStorage rejects on read', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

    await expect(shouldCelebrateFirstPublish('trajet')).resolves.toBe(false);
  });

  it('returns false when AsyncStorage rejects on write — the celebration is skipped, not crashed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage offline'));

    await expect(shouldCelebrateFirstPublish('trajet')).resolves.toBe(false);
  });
});

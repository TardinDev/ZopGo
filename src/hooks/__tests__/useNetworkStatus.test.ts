import * as Network from 'expo-network';
import { checkNetwork } from '../useNetworkStatus';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('checkNetwork', () => {
  it('returns true when connected', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: true,
    });
    const result = await checkNetwork();
    expect(result).toBe(true);
  });

  it('returns false when not connected', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: false,
    });
    const result = await checkNetwork();
    expect(result).toBe(false);
  });

  it('returns true when isConnected is undefined (nullish coalescing)', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({});
    const result = await checkNetwork();
    expect(result).toBe(true);
  });

  it('returns true on error (assumes connected)', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockRejectedValue(
      new Error('fail')
    );
    const result = await checkNetwork();
    expect(result).toBe(true);
  });
});

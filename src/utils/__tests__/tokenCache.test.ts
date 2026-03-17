import * as SecureStore from 'expo-secure-store';
import { tokenCache } from '../tokenCache';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('tokenCache', () => {
  describe('getToken', () => {
    it('returns stored token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('my-token');
      const result = await tokenCache.getToken('key');
      expect(result).toBe('my-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key');
    });

    it('returns null and deletes key on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await tokenCache.getToken('key');
      expect(result).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
    });
  });

  describe('saveToken', () => {
    it('saves token', async () => {
      await tokenCache.saveToken('key', 'value');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key', 'value');
    });

    it('handles error gracefully', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(tokenCache.saveToken('key', 'value')).resolves.toBeUndefined();
    });
  });

  describe('clearToken', () => {
    it('deletes token', async () => {
      await tokenCache.clearToken('key');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
    });

    it('handles error gracefully', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(tokenCache.clearToken('key')).resolves.toBeUndefined();
    });
  });
});

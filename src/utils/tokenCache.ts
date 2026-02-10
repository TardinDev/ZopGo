// Token cache for Clerk using expo-secure-store
import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/clerk-expo';

const createTokenCache = (): TokenCache => {
    return {
        getToken: async (key: string) => {
            try {
                const item = await SecureStore.getItemAsync(key);
                return item;
            } catch (error) {
                console.error('Error getting token from secure store:', error);
                await SecureStore.deleteItemAsync(key);
                return null;
            }
        },
        saveToken: async (key: string, token: string) => {
            try {
                await SecureStore.setItemAsync(key, token);
            } catch (error) {
                console.error('Error saving token to secure store:', error);
            }
        },
        clearToken: async (key: string) => {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (error) {
                console.error('Error clearing token from secure store:', error);
            }
        },
    };
};

export const tokenCache = createTokenCache();

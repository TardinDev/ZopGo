// Token cache for Clerk using expo-secure-store
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';
import type { TokenCache } from '@clerk/clerk-expo';

const createTokenCache = (): TokenCache => {
    return {
        getToken: async (key: string) => {
            try {
                const item = await SecureStore.getItemAsync(key);
                return item;
            } catch (error) {
                if (__DEV__) console.error('Error getting token from secure store:', error);
                else Sentry.captureException(error, { extra: { context: 'tokenCache.getToken', key } });
                await SecureStore.deleteItemAsync(key);
                return null;
            }
        },
        saveToken: async (key: string, token: string) => {
            try {
                await SecureStore.setItemAsync(key, token);
            } catch (error) {
                if (__DEV__) console.error('Error saving token to secure store:', error);
                else Sentry.captureException(error, { extra: { context: 'tokenCache.saveToken', key } });
            }
        },
        clearToken: async (key: string) => {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (error) {
                if (__DEV__) console.error('Error clearing token from secure store:', error);
                else Sentry.captureException(error, { extra: { context: 'tokenCache.clearToken', key } });
            }
        },
    };
};

export const tokenCache = createTokenCache();

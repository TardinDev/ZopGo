import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  trajet: 'zopgo:first-trajet-celebrated',
  hebergement: 'zopgo:first-hebergement-celebrated',
} as const;

export type CelebrationKind = keyof typeof KEYS;

/**
 * Returns true the first time the kind is celebrated for this device, then
 * persists a flag so subsequent publishes don't trigger the confetti again.
 *
 * Failures (storage offline) are swallowed and resolved as `false` — we'd
 * rather skip the celebration than block the publish flow.
 */
export async function shouldCelebrateFirstPublish(kind: CelebrationKind): Promise<boolean> {
  try {
    const existing = await AsyncStorage.getItem(KEYS[kind]);
    if (existing) return false;
    await AsyncStorage.setItem(KEYS[kind], new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}

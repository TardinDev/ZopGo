import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  trajet: 'zopgo:coachmark-trajet-seen',
  hebergement: 'zopgo:coachmark-hebergement-seen',
} as const;

export type CoachMarkKind = keyof typeof KEYS;

/**
 * Returns true on the first call for this kind on this device, false on
 * subsequent calls. Read-only — call markCoachMarkSeen() to flip the flag
 * once the user has actually engaged with the hint or completed the action.
 *
 * Failures (storage offline) resolve to false so we never spam a hint that
 * we can't dismiss reliably.
 */
export async function shouldShowCoachMark(kind: CoachMarkKind): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(KEYS[kind]);
    return !seen;
  } catch {
    return false;
  }
}

export async function markCoachMarkSeen(kind: CoachMarkKind): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS[kind], new Date().toISOString());
  } catch {
    // swallow — at worst the hint shows once more
  }
}

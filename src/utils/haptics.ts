import * as Haptics from 'expo-haptics';

/** Light tap feedback — for card presses, selections */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap feedback — for button presses, toggles */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy tap feedback — for destructive actions, confirmation */
export function hapticHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success notification — for booking confirmed, form submitted */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Error notification — for failed actions, validation errors */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Selection changed — for picker changes, counter +/- */
export function hapticSelection() {
  Haptics.selectionAsync();
}

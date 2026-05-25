/**
 * Human-readable "time ago" label in French. Shared between the messages
 * store and any UI surface that wants to recompute the label at render
 * time (rather than freezing it at insertion).
 *
 * Accepts either a Date object, an ISO string, or an epoch ms number so
 * callers can pass whichever they have on hand.
 */
export function formatTimeAgo(input: Date | string | number, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = now.getTime() - date.getTime();
  // Negative diff (clock skew / future-dated): clamp to "À l'instant"
  // rather than showing nonsense like "Il y a -5 min".
  if (diffMs < 0) return "À l'instant";

  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  return `Il y a ${diffD} jours`;
}

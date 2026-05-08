import { useEffect, useState } from 'react';

/**
 * Cycles through a list of strings on a fixed interval.
 *
 * Used to keep loading screens lively — chat-thinking, search spinners, etc.
 * Pass a stable array reference (defined module-level or via useMemo) so the
 * effect doesn't reset on every render.
 */
export function useRotatingMessage(messages: string[], intervalMs = 2200): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  return messages[index] ?? messages[0] ?? '';
}

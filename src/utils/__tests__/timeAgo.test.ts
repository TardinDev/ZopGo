import { formatTimeAgo } from '../timeAgo';

describe('formatTimeAgo', () => {
  const NOW = new Date('2026-03-15T12:00:00Z');

  describe('relative labels', () => {
    it("returns À l'instant for less than 1 minute ago", () => {
      const date = new Date(NOW.getTime() - 30 * 1000); // -30s
      expect(formatTimeAgo(date, NOW)).toBe("À l'instant");
    });

    it('returns "Il y a N min" for under an hour', () => {
      expect(formatTimeAgo(new Date(NOW.getTime() - 1 * 60_000), NOW)).toBe('Il y a 1 min');
      expect(formatTimeAgo(new Date(NOW.getTime() - 5 * 60_000), NOW)).toBe('Il y a 5 min');
      expect(formatTimeAgo(new Date(NOW.getTime() - 59 * 60_000), NOW)).toBe('Il y a 59 min');
    });

    it('returns "Il y a Nh" for under a day', () => {
      expect(formatTimeAgo(new Date(NOW.getTime() - 60 * 60_000), NOW)).toBe('Il y a 1h');
      expect(formatTimeAgo(new Date(NOW.getTime() - 5 * 60 * 60_000), NOW)).toBe('Il y a 5h');
      expect(formatTimeAgo(new Date(NOW.getTime() - 23 * 60 * 60_000), NOW)).toBe('Il y a 23h');
    });

    it('returns "Hier" exactly one day back', () => {
      expect(formatTimeAgo(new Date(NOW.getTime() - 24 * 60 * 60_000), NOW)).toBe('Hier');
    });

    it('returns "Il y a N jours" for two days or more', () => {
      expect(formatTimeAgo(new Date(NOW.getTime() - 2 * 24 * 60 * 60_000), NOW)).toBe('Il y a 2 jours');
      expect(formatTimeAgo(new Date(NOW.getTime() - 10 * 24 * 60 * 60_000), NOW)).toBe('Il y a 10 jours');
    });
  });

  describe('input formats', () => {
    it('accepts an ISO string', () => {
      expect(formatTimeAgo('2026-03-15T11:30:00Z', NOW)).toBe('Il y a 30 min');
    });

    it('accepts an epoch ms number', () => {
      const t = NOW.getTime() - 90 * 60_000; // 1h30 ago
      expect(formatTimeAgo(t, NOW)).toBe('Il y a 1h');
    });

    it('returns empty string for invalid input', () => {
      expect(formatTimeAgo('not-a-date', NOW)).toBe('');
      expect(formatTimeAgo(NaN, NOW)).toBe('');
    });
  });

  describe('edge cases', () => {
    it("clamps future-dated input to À l'instant (no negative labels)", () => {
      const future = new Date(NOW.getTime() + 60_000);
      expect(formatTimeAgo(future, NOW)).toBe("À l'instant");
    });

    it('uses the current Date when no `now` is provided', () => {
      // Just verify the call doesn't throw and returns a sensible label.
      const longAgo = new Date(Date.now() - 10 * 60_000);
      expect(formatTimeAgo(longAgo)).toBe('Il y a 10 min');
    });

    it('handles the exact 60-minute boundary correctly', () => {
      // 60 minutes = 1 hour, should show "Il y a 1h" not "Il y a 60 min".
      const exactHour = new Date(NOW.getTime() - 60 * 60_000);
      expect(formatTimeAgo(exactHour, NOW)).toBe('Il y a 1h');
    });

    it('handles the exact 24-hour boundary correctly', () => {
      // 24 hours = 1 day = "Hier", not "Il y a 24h".
      const exactDay = new Date(NOW.getTime() - 24 * 60 * 60_000);
      expect(formatTimeAgo(exactDay, NOW)).toBe('Hier');
    });
  });
});

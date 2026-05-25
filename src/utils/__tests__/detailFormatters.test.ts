import {
  cityCode,
  formatTime,
  formatLongDate,
  formatPriceFr,
  getVoyageAvailability,
  getHebergementAvailability,
  parseImagesParam,
} from '../detailFormatters';
import { COLORS } from '../../constants';

describe('cityCode', () => {
  it('returns first 3 letters uppercased', () => {
    expect(cityCode('Libreville')).toBe('LIB');
    expect(cityCode('Franceville')).toBe('FRA');
  });

  it('strips diacritics before taking 3 chars', () => {
    expect(cityCode('Lébamba')).toBe('LEB');
    expect(cityCode('Cocobeach')).toBe('COC');
  });

  it('skips spaces and dashes', () => {
    expect(cityCode('Port-Gentil')).toBe('POR');
    expect(cityCode('Saint Denis')).toBe('SAI');
  });

  it('returns "---" for empty / non-letter input', () => {
    expect(cityCode('')).toBe('---');
    expect(cityCode('   ')).toBe('---');
    expect(cityCode('123 / -')).toBe('---');
  });

  it('handles single-letter and short names without crashing', () => {
    expect(cityCode('A')).toBe('A');
    expect(cityCode('OZ')).toBe('OZ');
  });
});

describe('formatTime', () => {
  it('formats ISO datetimes as HH:mm with zero-padding', () => {
    expect(formatTime('2026-03-15T14:30:00Z')).toMatch(/^\d{2}:\d{2}$/);
    // We compare hours flexibly because the test runner's TZ varies.
    expect(formatTime('2026-03-15T09:05:00Z')).toMatch(/^\d{2}:0?5$/);
  });

  it('returns empty string for empty / invalid input', () => {
    expect(formatTime('')).toBe('');
    expect(formatTime('not-a-date')).toBe('');
  });
});

describe('formatLongDate', () => {
  it('formats as "Day DD mon" in French short form', () => {
    // Build the date in local time so the assertion is TZ-independent.
    const d = new Date(2026, 2, 15); // 2026-03-15 (March = month index 2)
    const iso = d.toISOString();
    expect(formatLongDate(iso)).toBe('Dim 15 mar');
  });

  it('uses the right French day prefix', () => {
    const monday = new Date(2026, 2, 16); // Mon 16 March 2026
    expect(formatLongDate(monday.toISOString())).toBe('Lun 16 mar');
  });

  it('returns empty for invalid / missing input', () => {
    expect(formatLongDate('')).toBe('');
    expect(formatLongDate('bogus')).toBe('');
  });
});

describe('formatPriceFr', () => {
  it('inserts thousand separators with spaces', () => {
    expect(formatPriceFr(1000)).toBe('1 000');
    expect(formatPriceFr(15000)).toBe('15 000');
    expect(formatPriceFr(1234567)).toBe('1 234 567');
  });

  it('returns plain digits below 1000', () => {
    expect(formatPriceFr(0)).toBe('0');
    expect(formatPriceFr(42)).toBe('42');
    expect(formatPriceFr(999)).toBe('999');
  });

  it('does not leave any commas behind (toLocaleString fallback)', () => {
    expect(formatPriceFr(123456)).not.toMatch(/,/);
  });
});

describe('getVoyageAvailability', () => {
  it('returns "Complet" with error color when 0 or less', () => {
    expect(getVoyageAvailability(0)).toEqual({ color: COLORS.error, label: 'Complet' });
    expect(getVoyageAvailability(-1)).toEqual({ color: COLORS.error, label: 'Complet' });
  });

  it('warns when 1 or 2 places remain (scarcity messaging)', () => {
    expect(getVoyageAvailability(1)).toEqual({ color: COLORS.warning, label: 'Plus que 1 !' });
    expect(getVoyageAvailability(2)).toEqual({ color: COLORS.warning, label: 'Plus que 2 !' });
  });

  it('shows plain count with success color when 3+ places remain', () => {
    expect(getVoyageAvailability(3)).toEqual({ color: COLORS.success, label: '3 places' });
    expect(getVoyageAvailability(7)).toEqual({ color: COLORS.success, label: '7 places' });
  });
});

describe('getHebergementAvailability', () => {
  it('returns "Complet" when 0 or less', () => {
    expect(getHebergementAvailability(0).label).toBe('Complet');
    expect(getHebergementAvailability(-2).label).toBe('Complet');
  });

  it('warns at 1 or 2 with scarcity messaging', () => {
    expect(getHebergementAvailability(1).label).toBe('Plus que 1 !');
    expect(getHebergementAvailability(2).label).toBe('Plus que 2 !');
  });

  it('uses abbreviated "dispo." label for 3+', () => {
    expect(getHebergementAvailability(3).label).toBe('3 dispo.');
    expect(getHebergementAvailability(12).label).toBe('12 dispo.');
  });
});

describe('parseImagesParam', () => {
  it('returns [] for empty / non-string input', () => {
    expect(parseImagesParam('')).toEqual([]);
    expect(parseImagesParam(undefined)).toEqual([]);
    expect(parseImagesParam(null)).toEqual([]);
    expect(parseImagesParam(42)).toEqual([]);
  });

  it('parses a JSON-encoded string[] from the listing', () => {
    const raw = JSON.stringify(['https://a.png', 'https://b.jpg']);
    expect(parseImagesParam(raw)).toEqual(['https://a.png', 'https://b.jpg']);
  });

  it('drops non-string and empty entries in the parsed array', () => {
    const raw = JSON.stringify(['https://a.png', '', null, 7, 'https://b.png']);
    expect(parseImagesParam(raw)).toEqual(['https://a.png', 'https://b.png']);
  });

  it('falls back to a single-URL list when the value is a raw http(s) url (legacy callers)', () => {
    expect(parseImagesParam('https://legacy.example.com/room.jpg')).toEqual([
      'https://legacy.example.com/room.jpg',
    ]);
  });

  it('returns [] when JSON parse fails and the value is not an http url', () => {
    expect(parseImagesParam('definitely-not-json')).toEqual([]);
    expect(parseImagesParam('{bad json')).toEqual([]);
  });

  it('returns [] when the parsed JSON is not an array', () => {
    expect(parseImagesParam(JSON.stringify({ url: 'x' }))).toEqual([]);
    expect(parseImagesParam(JSON.stringify('plain-string'))).toEqual([]);
  });
});

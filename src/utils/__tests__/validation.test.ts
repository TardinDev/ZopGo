import {
  validateLocation,
  sanitizeInput,
  validateName,
  validateCity,
  validatePrice,
  validatePlaces,
  validateEmail,
  validatePhone,
  validateAmount,
  formatPhone,
} from '../validation';

// ─── validateLocation ───────────────────────────────────────────────

describe('validateLocation', () => {
  it('returns false for empty string', () => {
    expect(validateLocation('')).toBe(false);
  });

  it('returns false for single char', () => {
    expect(validateLocation('A')).toBe(false);
  });

  it('returns false for whitespace-only short string', () => {
    expect(validateLocation('  A ')).toBe(false);
  });

  it('returns true for valid short location', () => {
    expect(validateLocation('LB')).toBe(true);
  });

  it('returns true for normal location', () => {
    expect(validateLocation('Libreville')).toBe(true);
  });

  it('returns false for string > 100 chars', () => {
    expect(validateLocation('A'.repeat(101))).toBe(false);
  });

  it('returns true for string exactly 100 chars', () => {
    expect(validateLocation('A'.repeat(100))).toBe(true);
  });

  it('returns false for null-ish values', () => {
    expect(validateLocation(undefined as unknown as string)).toBe(false);
    expect(validateLocation(null as unknown as string)).toBe(false);
  });
});

// ─── sanitizeInput ──────────────────────────────────────────────────

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('strips HTML tags', () => {
    expect(sanitizeInput('hello <b>world</b>')).toBe('hello world');
  });

  it('removes dangerous chars (<, >, &, ", \')', () => {
    // HTML tags are stripped first: '<b>' → '', then remaining dangerous chars removed
    // 'a<b>c&d"e\'f' → after tag strip: 'ac&d"e\'f' → after char strip: 'acdef'
    expect(sanitizeInput('a<b>c&d"e\'f')).toBe('acdef');
  });

  it('strips SQL keywords', () => {
    expect(sanitizeInput('DROP TABLE users')).toBe('TABLE users');
  });

  it('strips SQL keywords case-insensitively', () => {
    expect(sanitizeInput('select * from users')).toBe('* from users');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
  });

  it('removes event handlers', () => {
    expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
  });

  it('handles multiple SQL keywords', () => {
    const input = 'DROP TABLE; DELETE FROM; INSERT INTO';
    const result = sanitizeInput(input);
    expect(result).not.toMatch(/DROP|DELETE|INSERT/i);
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('   ')).toBe('');
  });
});

// ─── validateName ───────────────────────────────────────────────────

describe('validateName', () => {
  it('returns true for valid name', () => {
    expect(validateName('Jean-Pierre')).toBe(true);
  });

  it('returns true for name with accents', () => {
    expect(validateName('François')).toBe(true);
  });

  it('returns true for name with spaces', () => {
    expect(validateName("Jean d'Arc")).toBe(true);
  });

  it('returns false for single char', () => {
    expect(validateName('J')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateName('')).toBe(false);
  });

  it('returns false for name with numbers', () => {
    expect(validateName('Jean123')).toBe(false);
  });

  it('returns false for name > 50 chars', () => {
    expect(validateName('A'.repeat(51))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(validateName(undefined as unknown as string)).toBe(false);
    expect(validateName(null as unknown as string)).toBe(false);
  });
});

// ─── validateCity ───────────────────────────────────────────────────

describe('validateCity', () => {
  it('returns true for valid city', () => {
    expect(validateCity('Libreville')).toBe(true);
  });

  it('returns true for city with accent', () => {
    expect(validateCity('Port-Gentil')).toBe(true);
  });

  it('returns false for single char', () => {
    expect(validateCity('L')).toBe(false);
  });

  it('returns false for city with numbers', () => {
    expect(validateCity('City123')).toBe(false);
  });

  it('returns false for empty', () => {
    expect(validateCity('')).toBe(false);
  });
});

// ─── validatePrice ──────────────────────────────────────────────────

describe('validatePrice', () => {
  it('returns true for valid price', () => {
    expect(validatePrice(100)).toBe(true);
  });

  it('returns true for max price', () => {
    expect(validatePrice(1_000_000)).toBe(true);
  });

  it('returns false for 0', () => {
    expect(validatePrice(0)).toBe(false);
  });

  it('returns false for negative', () => {
    expect(validatePrice(-1)).toBe(false);
  });

  it('returns false for > 1,000,000', () => {
    expect(validatePrice(1_000_001)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(validatePrice(NaN)).toBe(false);
  });

  it('returns false for non-number', () => {
    expect(validatePrice('100' as unknown as number)).toBe(false);
  });
});

// ─── validatePlaces ─────────────────────────────────────────────────

describe('validatePlaces', () => {
  it('returns true for 1', () => {
    expect(validatePlaces(1)).toBe(true);
  });

  it('returns true for 8', () => {
    expect(validatePlaces(8)).toBe(true);
  });

  it('returns false for 0', () => {
    expect(validatePlaces(0)).toBe(false);
  });

  it('returns false for 9', () => {
    expect(validatePlaces(9)).toBe(false);
  });

  it('returns false for float', () => {
    expect(validatePlaces(1.5)).toBe(false);
  });

  it('returns false for negative', () => {
    expect(validatePlaces(-1)).toBe(false);
  });
});

// ─── validateEmail ──────────────────────────────────────────────────

describe('validateEmail', () => {
  it('returns true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('returns true for email with subdomain', () => {
    expect(validateEmail('user@sub.domain.com')).toBe(true);
  });

  it('returns false for missing @', () => {
    expect(validateEmail('testexample.com')).toBe(false);
  });

  it('returns false for missing domain', () => {
    expect(validateEmail('test@')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('returns false for spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false);
  });
});

// ─── validatePhone ──────────────────────────────────────────────────

describe('validatePhone', () => {
  // Regex: /^(\+241|0)[0-9]{1}\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}$/
  // Applied to phone.replace(/\s/g, ''), so spaces are stripped first
  // After prefix (+241 or 0), exactly 7 digits: X XX XX XX

  it('returns true for +241 format (7 digits after prefix)', () => {
    // After space stripping, regex is effectively: ^(\+241|0)\d{7}$
    expect(validatePhone('+2410712345')).toBe(true); // +241 + 7 digits
    expect(validatePhone('+2417123456')).toBe(true); // +241 + 7 digits
  });

  it('returns false for wrong digit count', () => {
    expect(validatePhone('+241071234')).toBe(false); // +241 + 6 digits (too few)
    expect(validatePhone('+24107123456')).toBe(false); // +241 + 8 digits (too many)
  });

  it('returns true for +241 with spaces', () => {
    // After stripping spaces: +2417123456 → matches
    expect(validatePhone('+241 7 12 34 56')).toBe(true);
  });

  it('returns true for 0X format (7 digits after 0)', () => {
    expect(validatePhone('07123456')).toBe(true); // 0 + 7 digits
  });

  it('returns false for random string', () => {
    expect(validatePhone('abc')).toBe(false);
  });

  it('returns false for too short', () => {
    expect(validatePhone('+241071')).toBe(false);
  });
});

// ─── validateAmount ─────────────────────────────────────────────────

describe('validateAmount', () => {
  it('returns true for positive number', () => {
    expect(validateAmount(100)).toBe(true);
  });

  it('returns true for string number', () => {
    expect(validateAmount('50.5')).toBe(true);
  });

  it('returns false for 0', () => {
    expect(validateAmount(0)).toBe(false);
  });

  it('returns false for negative', () => {
    expect(validateAmount(-10)).toBe(false);
  });

  it('returns false for non-numeric string', () => {
    expect(validateAmount('abc')).toBe(false);
  });
});

// ─── formatPhone ────────────────────────────────────────────────────

describe('formatPhone', () => {
  it('formats 241 prefixed number', () => {
    // 24107123456 → slice(3)=07123456 → +241 0 71 23 45
    expect(formatPhone('24107123456')).toBe('+241 0 71 23 45');
  });

  it('formats shorter 241 number', () => {
    // 2417123456 → slice(3)=7123456 → +241 7 12 34 56
    expect(formatPhone('2417123456')).toBe('+241 7 12 34 56');
  });

  it('returns original for non-241 number', () => {
    expect(formatPhone('07123456')).toBe('07123456');
  });

  it('strips non-digits before formatting', () => {
    // +241-07-12-34-56 → digits: 24107123456 → +241 0 71 23 45
    expect(formatPhone('+241-07-12-34-56')).toBe('+241 0 71 23 45');
  });
});

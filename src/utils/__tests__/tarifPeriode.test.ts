import {
  TARIF_PERIODES,
  periodeLabel,
  periodeSuffixe,
  uniteLabel,
  joursParUnite,
  maxUnites,
  dureeEnNuits,
  isTarifPeriode,
} from '../tarifPeriode';

describe('TARIF_PERIODES', () => {
  it('lists the three supported periods in order', () => {
    expect(TARIF_PERIODES).toEqual(['nuit', 'semaine', 'mois']);
  });
});

describe('periodeLabel', () => {
  it('returns the human label for each period', () => {
    expect(periodeLabel('nuit')).toBe('Nuit');
    expect(periodeLabel('semaine')).toBe('Semaine');
    expect(periodeLabel('mois')).toBe('Mois');
  });
});

describe('periodeSuffixe', () => {
  it('returns the suffix used in "X FCFA/<suffixe>"', () => {
    expect(periodeSuffixe('nuit')).toBe('nuit');
    expect(periodeSuffixe('semaine')).toBe('semaine');
    expect(periodeSuffixe('mois')).toBe('mois');
  });
});

describe('uniteLabel', () => {
  it('uses singular for 1 unit', () => {
    expect(uniteLabel('nuit', 1)).toBe('1 nuit');
    expect(uniteLabel('semaine', 1)).toBe('1 semaine');
    expect(uniteLabel('mois', 1)).toBe('1 mois');
  });

  it('pluralizes nuit and semaine but not mois', () => {
    expect(uniteLabel('nuit', 3)).toBe('3 nuits');
    expect(uniteLabel('semaine', 2)).toBe('2 semaines');
    expect(uniteLabel('mois', 4)).toBe('4 mois');
  });
});

describe('joursParUnite', () => {
  it('maps each period to its day count', () => {
    expect(joursParUnite('nuit')).toBe(1);
    expect(joursParUnite('semaine')).toBe(7);
    expect(joursParUnite('mois')).toBe(30);
  });
});

describe('maxUnites', () => {
  it('caps nightly bookings higher than weekly/monthly', () => {
    expect(maxUnites('nuit')).toBe(30);
    expect(maxUnites('semaine')).toBe(12);
    expect(maxUnites('mois')).toBe(12);
  });
});

describe('dureeEnNuits', () => {
  it('converts a unit count into a number of nights', () => {
    expect(dureeEnNuits('nuit', 3)).toBe(3);
    expect(dureeEnNuits('semaine', 2)).toBe(14);
    expect(dureeEnNuits('mois', 1)).toBe(30);
  });

  it('treats a non-positive unit count as at least one unit', () => {
    expect(dureeEnNuits('semaine', 0)).toBe(7);
    expect(dureeEnNuits('mois', -2)).toBe(30);
  });
});

describe('isTarifPeriode', () => {
  it('accepts the three valid periods', () => {
    expect(isTarifPeriode('nuit')).toBe(true);
    expect(isTarifPeriode('semaine')).toBe(true);
    expect(isTarifPeriode('mois')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isTarifPeriode('annee')).toBe(false);
    expect(isTarifPeriode('')).toBe(false);
    expect(isTarifPeriode(undefined)).toBe(false);
    expect(isTarifPeriode(null)).toBe(false);
  });
});

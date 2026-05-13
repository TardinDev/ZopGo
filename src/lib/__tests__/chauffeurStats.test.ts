import { computeChauffeurStats, formatFcfa } from '../chauffeurStats';
import type { Reservation, ReservationStatus } from '../../types';

function r(status: ReservationStatus, prix = 5000): Reservation {
  return {
    id: `r-${Math.random()}`,
    trajetId: 't',
    clientId: 'c',
    chauffeurId: 'cf',
    nombrePlaces: 1,
    prixTotal: prix,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('computeChauffeurStats', () => {
  it('returns zeros for an empty list', () => {
    const s = computeChauffeurStats([]);
    expect(s).toEqual({
      totalCourses: 0,
      coursesAcceptees: 0,
      coursesTerminees: 0,
      revenus: 0,
      tauxAcceptationPct: 0,
      noteMoyenne: 0,
    });
  });

  it('counts acceptee, en_route, arrivee, terminee as accepted', () => {
    const s = computeChauffeurStats([
      r('acceptee'),
      r('en_route'),
      r('arrivee'),
      r('terminee'),
      r('refusee'),
    ]);
    expect(s.coursesAcceptees).toBe(4);
  });

  it('only sums prix for terminees in revenus', () => {
    const s = computeChauffeurStats([
      r('terminee', 5000),
      r('terminee', 3000),
      r('acceptee', 1000), // not counted — not finalised
      r('en_route', 9999), // not counted — not finalised
    ]);
    expect(s.revenus).toBe(8000);
    expect(s.coursesTerminees).toBe(2);
  });

  it('excludes expiree from the acceptation rate denominator', () => {
    const s = computeChauffeurStats([
      r('acceptee'),
      r('refusee'),
      r('expiree'),
      r('expiree'),
    ]);
    // denom = total - expirees = 2; accepted = 1 → 50%
    expect(s.tauxAcceptationPct).toBe(50);
  });

  it('returns 0% acceptance when every reservation expired', () => {
    const s = computeChauffeurStats([r('expiree'), r('expiree')]);
    expect(s.tauxAcceptationPct).toBe(0);
  });

  it('forwards profileRating verbatim', () => {
    const s = computeChauffeurStats([], 4.8);
    expect(s.noteMoyenne).toBe(4.8);
  });

  it('defaults noteMoyenne to 0 when profileRating is undefined', () => {
    const s = computeChauffeurStats([r('terminee')]);
    expect(s.noteMoyenne).toBe(0);
  });

  it('rounds tauxAcceptation to the nearest integer', () => {
    // 1 accepted out of 3 non-expired → 33.33% → 33
    const s = computeChauffeurStats([r('acceptee'), r('refusee'), r('refusee')]);
    expect(s.tauxAcceptationPct).toBe(33);
  });
});

describe('formatFcfa', () => {
  it('formats with spaces as thousands separator', () => {
    const out = formatFcfa(1234567);
    expect(out).toMatch(/FCFA$/);
    // Either NBSP (U+202F or U+00A0) or regular space — depends on Node ICU build.
    expect(out.replace(/[\s  ]/g, '')).toBe('1234567FCFA');
  });

  it('formats zero', () => {
    expect(formatFcfa(0)).toMatch(/^0\s?FCFA$/);
  });
});

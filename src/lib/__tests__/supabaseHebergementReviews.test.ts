jest.unmock('../supabaseHebergementReviews');

import { supabase } from '../supabase';
import {
  computeReviewSummary,
  fetchHebergementReviews,
  clientCanReviewHebergement,
  submitHebergementReview,
} from '../supabaseHebergementReviews';
import type { HebergementReview } from '../../types';

function chain(resolved: { data?: unknown; error: unknown; count?: number }) {
  const c: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  for (const m of ['select', 'insert', 'upsert', 'update', 'eq', 'order', 'limit', 'single']) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.then = jest.fn((res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  );
  return c;
}

const review = (rating: number): HebergementReview => ({
  id: 'x',
  hebergementId: 'h',
  clientId: 'c',
  rating,
  comment: '',
  createdAt: '2026-01-01',
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('computeReviewSummary', () => {
  it('returns a zeroed summary for no reviews', () => {
    expect(computeReviewSummary([])).toEqual({
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    });
  });

  it('computes average (1 decimal), total and distribution', () => {
    const s = computeReviewSummary([review(5), review(4), review(4)]);
    expect(s.total).toBe(3);
    expect(s.average).toBe(4.3); // (5+4+4)/3 = 4.333 → 4.3
    expect(s.distribution[5]).toBe(1);
    expect(s.distribution[4]).toBe(2);
  });

  it('ignores ratings outside 1-5 so a bad row cannot skew the histogram', () => {
    const s = computeReviewSummary([review(5), review(0), review(9)]);
    expect(s.total).toBe(1);
    expect(s.average).toBe(5);
  });
});

describe('fetchHebergementReviews', () => {
  it('maps rows (incl. joined author) to HebergementReview', async () => {
    const c = chain({
      data: [
        {
          id: 'r1',
          hebergement_id: 'h1',
          client_id: 'c1',
          rating: 5,
          comment: 'Top',
          created_at: '2026-01-02',
          client: { name: 'Awa', avatar: 'a.png' },
        },
      ],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchHebergementReviews('h1');
    expect(out).toHaveLength(1);
    expect(out[0].authorName).toBe('Awa');
    expect(out[0].rating).toBe(5);
  });

  it('returns [] on error', async () => {
    (supabase.from as jest.Mock).mockReturnValue(chain({ data: null, error: { message: 'x' } }));
    expect(await fetchHebergementReviews('h1')).toEqual([]);
  });
});

describe('clientCanReviewHebergement', () => {
  it('is true when the client has at least one reservation for the listing', async () => {
    (supabase.from as jest.Mock).mockReturnValue(chain({ count: 2, error: null }));
    expect(await clientCanReviewHebergement('c1', 'h1')).toBe(true);
  });

  it('is false when there is no reservation', async () => {
    (supabase.from as jest.Mock).mockReturnValue(chain({ count: 0, error: null }));
    expect(await clientCanReviewHebergement('c1', 'h1')).toBe(false);
  });
});

describe('submitHebergementReview', () => {
  it('upserts and returns the mapped review', async () => {
    const c = chain({
      data: {
        id: 'r1',
        hebergement_id: 'h1',
        client_id: 'c1',
        rating: 4,
        comment: 'Bien',
        created_at: '2026-01-03',
        client: { name: 'Awa', avatar: 'a.png' },
      },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await submitHebergementReview({
      hebergementId: 'h1',
      clientId: 'c1',
      rating: 4,
      comment: 'Bien',
    });
    expect(c.upsert).toHaveBeenCalled();
    const [payload, opts] = c.upsert.mock.calls[0];
    expect(payload.rating).toBe(4);
    expect(opts).toEqual({ onConflict: 'hebergement_id,client_id' });
    expect(out?.id).toBe('r1');
  });

  it('returns null on error', async () => {
    (supabase.from as jest.Mock).mockReturnValue(chain({ data: null, error: { message: 'rls' } }));
    const out = await submitHebergementReview({
      hebergementId: 'h1',
      clientId: 'c1',
      rating: 4,
      comment: 'x',
    });
    expect(out).toBeNull();
  });
});

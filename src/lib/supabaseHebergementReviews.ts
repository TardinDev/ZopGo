import { supabase } from './supabase';
import { sanitizeInput } from '../utils/validation';
import type { HebergementReview, RatingSummaryData } from '../types';

interface SupabaseHebergementReviewRow {
  id: string;
  hebergement_id: string;
  client_id: string;
  rating: number;
  comment: string;
  created_at: string;
  client?: { name: string; avatar: string } | null;
}

function mapRow(row: SupabaseHebergementReviewRow): HebergementReview {
  return {
    id: row.id,
    hebergementId: row.hebergement_id,
    clientId: row.client_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    authorName: row.client?.name,
    authorAvatar: row.client?.avatar,
  };
}

/**
 * Pure aggregation — average (1 decimal), total, and the 1-5 distribution.
 * Ratings outside 1-5 are ignored so a bad row can't skew the histogram.
 * Kept pure (no Supabase) so it's unit-testable.
 */
export function computeReviewSummary(reviews: HebergementReview[]): RatingSummaryData {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let total = 0;
  for (const r of reviews) {
    const star = Math.round(r.rating);
    if (star >= 1 && star <= 5) {
      distribution[star as 1 | 2 | 3 | 4 | 5] += 1;
      sum += star;
      total += 1;
    }
  }
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  return { average, total, distribution };
}

export async function fetchHebergementReviews(
  hebergementId: string
): Promise<HebergementReview[]> {
  const { data, error } = await supabase
    .from('hebergement_reviews')
    .select('*, client:client_id(name, avatar)')
    .eq('hebergement_id', hebergementId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('fetchHebergementReviews error:', error.message);
    return [];
  }
  return ((data as SupabaseHebergementReviewRow[]) || []).map(mapRow);
}

/**
 * Whether a client may review this listing — true iff they have at least one
 * reservation for it. Mirrors the RLS write guard so the UI can show/hide the
 * "Laisser un avis" affordance up front instead of failing on submit.
 */
export async function clientCanReviewHebergement(
  clientId: string,
  hebergementId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('hebergement_reservations')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('hebergement_id', hebergementId);

  if (error) {
    if (__DEV__) console.error('clientCanReviewHebergement error:', error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

/**
 * Upserts the client's review for a listing (one per client per logement).
 * RLS still enforces the reservation guard server-side.
 */
export async function submitHebergementReview(params: {
  hebergementId: string;
  clientId: string;
  rating: number;
  comment: string;
}): Promise<HebergementReview | null> {
  const { data, error } = await supabase
    .from('hebergement_reviews')
    .upsert(
      {
        hebergement_id: params.hebergementId,
        client_id: params.clientId,
        rating: params.rating,
        comment: sanitizeInput(params.comment),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'hebergement_id,client_id' }
    )
    .select('*, client:client_id(name, avatar)')
    .single();

  if (error) {
    if (__DEV__) console.error('submitHebergementReview error:', error.message);
    return null;
  }
  return mapRow(data as SupabaseHebergementReviewRow);
}

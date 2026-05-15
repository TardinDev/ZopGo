import type { Reservation } from '../types';

export interface ChauffeurStats {
  totalCourses: number;       // # demandes reçues (toutes confondues)
  coursesAcceptees: number;   // # acceptées + en cours + terminées
  coursesTerminees: number;   // # courses livrées
  revenus: number;            // somme prix_total des terminées
  tauxAcceptationPct: number; // 0–100, exclut les expirées du dénominateur
  noteMoyenne: number;        // copie de profile.rating si fourni
}

const ACTIVE_OR_DONE = new Set<string>([
  'acceptee',
  'en_route',
  'arrivee',
  'terminee',
]);

const TERMINATED = new Set<string>(['terminee']);

export function computeChauffeurStats(
  reservations: Reservation[],
  profileRating?: number
): ChauffeurStats {
  let totalCourses = 0;
  let coursesAcceptees = 0;
  let coursesTerminees = 0;
  let revenus = 0;
  let denomTaux = 0; // total - expirées

  for (const r of reservations) {
    totalCourses += 1;
    if (r.status !== 'expiree') denomTaux += 1;
    if (ACTIVE_OR_DONE.has(r.status)) coursesAcceptees += 1;
    if (TERMINATED.has(r.status)) {
      coursesTerminees += 1;
      revenus += r.prixTotal || 0;
    }
  }

  const tauxAcceptationPct =
    denomTaux === 0 ? 0 : Math.round((coursesAcceptees / denomTaux) * 100);

  return {
    totalCourses,
    coursesAcceptees,
    coursesTerminees,
    revenus,
    tauxAcceptationPct,
    noteMoyenne: profileRating ?? 0,
  };
}

export function formatFcfa(amount: number): string {
  // 1 234 567 FCFA. We keep Node's narrow no-break-space separator so
  // the number doesn't wrap mid-figure on small screens.
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

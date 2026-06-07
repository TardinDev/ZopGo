// Source unique de vérité pour la période de tarification d'un hébergement.
// Un logement a UN prix (`prix_par_nuit` en base — le nom est conservé pour
// rétro-compatibilité) appliqué sur la période choisie par l'hôte : la nuit,
// la semaine ou le mois. Tout l'affichage et le calcul de réservation passent
// par ce module pour rester cohérents.

export type TarifPeriode = 'nuit' | 'semaine' | 'mois';

export const TARIF_PERIODES: TarifPeriode[] = ['nuit', 'semaine', 'mois'];

const LABELS: Record<TarifPeriode, string> = {
  nuit: 'Nuit',
  semaine: 'Semaine',
  mois: 'Mois',
};

const JOURS: Record<TarifPeriode, number> = {
  nuit: 1,
  semaine: 7,
  mois: 30,
};

const MAX_UNITES: Record<TarifPeriode, number> = {
  nuit: 30,
  semaine: 12,
  mois: 12,
};

// « mois » est invariable en français ; « nuit » et « semaine » prennent un -s.
const PLURIEL: Record<TarifPeriode, boolean> = {
  nuit: true,
  semaine: true,
  mois: false,
};

export function periodeLabel(periode: TarifPeriode): string {
  return LABELS[periode];
}

// Utilisé dans « 15000 FCFA/<suffixe> » — le suffixe est la période au singulier.
export function periodeSuffixe(periode: TarifPeriode): string {
  return periode;
}

export function joursParUnite(periode: TarifPeriode): number {
  return JOURS[periode];
}

export function maxUnites(periode: TarifPeriode): number {
  return MAX_UNITES[periode];
}

// « 2 semaines », « 1 mois », « 3 nuits » — pluriel correct selon la période.
export function uniteLabel(periode: TarifPeriode, count: number): string {
  const base = periode;
  const suffix = PLURIEL[periode] && count > 1 ? 's' : '';
  return `${count} ${base}${suffix}`;
}

// Durée totale du séjour en nuits, stockée côté réservation (`nombre_nuits`).
// Un compteur <= 0 vaut au moins une unité.
export function dureeEnNuits(periode: TarifPeriode, nbUnites: number): number {
  const units = nbUnites > 0 ? nbUnites : 1;
  return units * JOURS[periode];
}

export function isTarifPeriode(value: unknown): value is TarifPeriode {
  return value === 'nuit' || value === 'semaine' || value === 'mois';
}

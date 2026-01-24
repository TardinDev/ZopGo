import { Review, RatingSummaryData } from '../types';

// Données d'exemple pour les avis reçus
export const receivedReviews: Review[] = [
  {
    id: 1,
    rating: 5,
    comment: 'Excellent chauffeur ! Très ponctuel et véhicule impeccable. Je recommande vivement.',
    authorName: 'Marie Ndong',
    authorAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    date: '2026-01-15',
    tripType: 'voyage',
  },
  {
    id: 2,
    rating: 5,
    comment: 'Livraison rapide et colis en parfait état. Merci beaucoup !',
    authorName: 'Jean-Baptiste Moussavou',
    authorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    date: '2026-01-14',
    tripType: 'livraison',
  },
  {
    id: 3,
    rating: 4,
    comment: 'Très bon service, petit retard mais communication claire.',
    authorName: 'Sandrine Obame',
    authorAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    date: '2026-01-12',
    tripType: 'voyage',
  },
  {
    id: 4,
    rating: 5,
    comment: 'Super expérience ! Chauffeur très sympa et trajet agréable.',
    authorName: 'Patrick Ella',
    authorAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    date: '2026-01-10',
    tripType: 'voyage',
  },
  {
    id: 5,
    rating: 4,
    comment: 'Bonne location, véhicule propre et bien entretenu.',
    authorName: 'Estelle Mba',
    authorAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    date: '2026-01-08',
    tripType: 'location',
  },
];

// Données d'exemple pour les avis donnés
export const givenReviews: Review[] = [
  {
    id: 101,
    rating: 5,
    comment: 'Client très agréable et ponctuel. Plaisir de travailler avec lui.',
    authorName: 'Pierre Ondo Mba',
    authorAvatar:
      'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=100&h=100&fit=crop&crop=face',
    date: '2026-01-14',
    tripType: 'voyage',
  },
  {
    id: 102,
    rating: 4,
    comment: 'Colis bien emballé, livraison sans problème.',
    authorName: 'Pierre Ondo Mba',
    authorAvatar:
      'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=100&h=100&fit=crop&crop=face',
    date: '2026-01-11',
    tripType: 'livraison',
  },
];

// Résumé des notes de l'utilisateur
export const userRatingSummary: RatingSummaryData = {
  average: 4.8,
  total: 156,
  distribution: {
    5: 120,
    4: 28,
    3: 5,
    2: 2,
    1: 1,
  },
};

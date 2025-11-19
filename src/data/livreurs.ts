/**
 * Données des livreurs disponibles
 */

export interface Livreur {
  id: number;
  prenom: string;
  vehicule: string;
  etoiles: number;
  disponible: boolean;
  photo: string;
  commentaires: string[];
  distance: number;
}

export const livreurs: Livreur[] = [
  {
    id: 1,
    prenom: 'Mamadou',
    vehicule: '🚲 Vélo',
    etoiles: 4.5,
    disponible: true,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    commentaires: ['Rapide et sympa', 'Très pro'],
    distance: 1.2,
  },
  {
    id: 2,
    prenom: 'Fatou',
    vehicule: '🏍️ Moto',
    etoiles: 4.8,
    disponible: false,
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop',
    commentaires: ['Service impeccable', "Toujours à l'heure"],
    distance: 2.0,
  },
  {
    id: 3,
    prenom: 'Kofi',
    vehicule: '🚐 Mini-bus',
    etoiles: 4.2,
    disponible: true,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    commentaires: ['Super professionnel', 'Très ponctuel'],
    distance: 1.8,
  },
  {
    id: 4,
    prenom: 'Amina',
    vehicule: '🚗 Voiture',
    etoiles: 4.7,
    disponible: true,
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    commentaires: ['Rapide', 'Souriante'],
    distance: 1.5,
  },
  {
    id: 5,
    prenom: 'Ibrahim',
    vehicule: '🚛 Camionnette',
    etoiles: 4.3,
    disponible: false,
    photo: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop',
    commentaires: ['Top!', 'Consciencieux'],
    distance: 2.5,
  },
];

/**
 * Retourne les livreurs triés par distance
 */
export const getSortedLivreursByDistance = () =>
  [...livreurs].sort((a, b) => a.distance - b.distance);

/**
 * Retourne uniquement les livreurs disponibles
 */
export const getAvailableLivreurs = () =>
  livreurs.filter(l => l.disponible);

/**
 * Retourne les livreurs disponibles triés par distance
 */
export const getAvailableLivreursSorted = () =>
  getAvailableLivreurs().sort((a, b) => a.distance - b.distance);

/**
 * Trouve un livreur par ID
 */
export const getLivreurById = (id: number) =>
  livreurs.find(l => l.id === id);

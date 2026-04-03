import { MenuItem } from '../types';

// Menu des paramètres du profil
// roles: si défini, l'item n'apparaît que pour ces rôles. Si absent, visible pour tous.
export const menuItems: MenuItem[] = [
  {
    id: 'personal-info',
    icon: 'person-outline',
    title: 'Informations personnelles',
    subtitle: 'Modifier vos données',
  },
  {
    id: 'reviews',
    icon: 'star-outline',
    title: 'Mes avis',
    subtitle: 'Voir vos évaluations',
  },
  {
    id: 'vehicles',
    icon: 'car-outline',
    title: 'Mes véhicules',
    subtitle: 'Gérer vos véhicules',
    roles: ['chauffeur'],
  },
  {
    id: 'accommodations',
    icon: 'home-outline',
    title: 'Mes logements',
    subtitle: 'Gérer vos logements',
    roles: ['hebergeur'],
  },
  {
    id: 'payment',
    icon: 'card-outline',
    title: 'Méthodes de paiement',
    subtitle: 'Cartes et comptes',
  },
  {
    id: 'security',
    icon: 'shield-outline',
    title: 'Sécurité',
    subtitle: 'Mot de passe et authentification',
  },
  {
    id: 'help',
    icon: 'help-circle-outline',
    title: 'Aide et support',
    subtitle: 'FAQ et contact',
  },
  {
    id: 'settings',
    icon: 'settings-outline',
    title: 'Paramètres',
    subtitle: 'Préférences générales',
  },
];

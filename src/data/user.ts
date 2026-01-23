import { UserInfo, MenuItem } from '../types';

// Informations de l'utilisateur
export const userInfo: UserInfo = {
  name: 'Pierre Ondo Mba',
  email: 'pierre.ondo@gmail.com',
  phone: '+241 06 12 34 56',
  avatar:
    'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face',
  rating: 4.8,
  totalTrips: 156,
  totalDeliveries: 89,
  memberSince: '2023',
};

// Menu des paramètres du profil
export const menuItems: MenuItem[] = [
  {
    icon: 'person-outline',
    title: 'Informations personnelles',
    subtitle: 'Modifier vos données',
  },
  {
    icon: 'star-outline',
    title: 'Mes avis',
    subtitle: 'Voir vos évaluations',
  },
  {
    icon: 'car-outline',
    title: 'Mes véhicules',
    subtitle: 'Gérer vos véhicules',
  },
  {
    icon: 'card-outline',
    title: 'Méthodes de paiement',
    subtitle: 'Cartes et comptes',
  },
  {
    icon: 'location-outline',
    title: 'Adresses favorites',
    subtitle: 'Gérer vos adresses',
  },
  {
    icon: 'notifications-outline',
    title: 'Notifications',
    subtitle: 'Paramètres des alertes',
  },
  {
    icon: 'shield-outline',
    title: 'Sécurité',
    subtitle: 'Mot de passe et authentification',
  },
  {
    icon: 'help-circle-outline',
    title: 'Aide et support',
    subtitle: 'FAQ et contact',
  },
  {
    icon: 'settings-outline',
    title: 'Paramètres',
    subtitle: 'Préférences générales',
  },
];

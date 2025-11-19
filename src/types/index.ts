// Types pour les voyages
export interface Voyage {
  id: number;
  type: string;
  from: string;
  to: string;
  price: string;
  icon: string;
}

// Types pour les hébergements
export interface Hebergement {
  id: number;
  type: string;
  name: string;
  location: string;
  price: string;
  rating: number;
  icon: string;
}

// Types pour les informations utilisateur
export interface UserInfo {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  totalDeliveries: number;
  memberSince: string;
}

// Types pour les éléments de menu
export interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
}

// Types pour les statistiques
export interface Stat {
  id: number;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

// Types pour les activités récentes
export interface Activity {
  id: number;
  type: 'course' | 'delivery';
  title: string;
  time: string;
  price: string;
  status: 'completed' | 'in_progress';
  icon: string;
}

// Types pour les livreurs
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

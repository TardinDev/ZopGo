// Types pour les voyages
export interface Voyage {
  id: number;
  type: string;
  from: string;
  to: string;
  price: string;
  icon: string;
  chauffeurName?: string;
  chauffeurAvatar?: string;
  chauffeurRating?: number;
  placesDisponibles?: number;
  date?: string;
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
  hebergeurName?: string;
  hebergeurAvatar?: string;
  hebergeurRating?: number;
  capacite?: number;
  description?: string;
  adresse?: string;
}

// Types pour les informations utilisateur
export interface UserInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  totalDeliveries: number;
  memberSince: string;
}

// Types pour les éléments de menu
export interface MenuItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  roles?: ('client' | 'chauffeur' | 'hebergeur')[];
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
  id: string;
  prenom: string;
  vehicule: string;
  etoiles: number;
  disponible: boolean;
  photo: string;
  commentaires: string[];
  distance: number;
}

// Types pour les évaluations
export interface Review {
  id: number;
  rating: number;
  comment: string;
  authorName: string;
  authorAvatar: string;
  date: string;
  tripType: 'voyage' | 'livraison' | 'location';
  tripId?: number;
}

// Types pour le résumé des notes
export interface RatingSummaryData {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Types pour les trajets proposés par les chauffeurs
export type TrajetStatus = 'en_attente' | 'effectue';

export interface Trajet {
  id: string;
  chauffeurId: string;
  villeDepart: string;
  villeArrivee: string;
  prix: number;
  vehicule: VehicleType;
  date: string; // ISO string
  placesDisponibles: number;
  status: TrajetStatus;
  createdAt: string; // ISO string
}

// Types pour l'authentification et les rôles
export type UserRole = 'client' | 'chauffeur' | 'hebergeur';

export type VehicleType = 'moto' | 'velo' | 'voiture' | 'camionnette';

export interface VehicleInfo {
  type: VehicleType;
  label: string;
  icon: string;
}

// Types pour les hébergeurs
export type AccommodationType = 'hotel' | 'auberge' | 'appartement' | 'maison' | 'chambre';

export interface AccommodationInfo {
  type: AccommodationType;
  label: string;
  icon: string;
}

// Profil chauffeur (étend UserInfo avec infos spécifiques)
export interface ChauffeurProfile extends UserInfo {
  vehicule: VehicleInfo;
  disponible: boolean;
  distance?: number; // Distance par rapport au client (calculée dynamiquement)
}

// Profil hébergeur (étend UserInfo avec infos spécifiques)
export interface HebergeurProfile extends UserInfo {
  accommodation: AccommodationInfo;
  disponible: boolean;
}

// Listing d'hébergement proposé par un hébergeur
export type HebergementStatus = 'actif' | 'inactif';

export interface HebergeurListing {
  id: string;
  hebergeurId: string;
  nom: string;
  type: AccommodationType;
  ville: string;
  adresse: string;
  prixParNuit: number;
  capacite: number;
  description: string;
  status: HebergementStatus;
  createdAt: string;
}

// Types pour les préférences de notifications push
export interface NotificationPreferences {
  courses: boolean;
  trajets: boolean;
  hebergements: boolean;
  promotions: boolean;
}
export type NotificationCategory = keyof NotificationPreferences;

// Utilisateur authentifié (peut être client, chauffeur ou hébergeur)
export interface AuthUser {
  id: string;
  role: UserRole;
  profile: UserInfo | ChauffeurProfile | HebergeurProfile;
}

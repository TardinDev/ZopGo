// Types pour les voyages
export interface Voyage {
  id: string;
  type: string;
  from: string;
  to: string;
  price: string;
  icon: string;
  chauffeurName?: string;
  chauffeurAvatar?: string;
  chauffeurRating?: number;
  chauffeurProfileId?: string;
  placesDisponibles?: number;
  date?: string;
  marque?: string;
  modele?: string;
  couleur?: string;
}

// Types pour les hébergements
export interface Hebergement {
  id: number;
  supabaseId: string;
  type: string;
  name: string;
  location: string;
  price: string;
  prixParNuit: number;
  rating: number;
  icon: string;
  images?: string[];
  hebergeurName?: string;
  hebergeurAvatar?: string;
  hebergeurRating?: number;
  hebergeurProfileId?: string;
  capacite?: number;
  disponibilite?: number;
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
  id: string;
  type: 'course' | 'delivery' | 'hebergement';
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
  // Supabase profile UUID — required to create real livraisons (FK target).
  // Absent on static demo drivers; livraisons.tsx filters those out.
  supabaseProfileId?: string;
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
export type TrajetStatus = 'en_attente' | 'effectue' | 'complet';

// Types pour les réservations
// Status flow (post-migration 022):
//   en_attente -> acceptee | refusee | annulee | expiree
//   acceptee   -> en_route | annulee
//   en_route   -> arrivee  | annulee
//   arrivee    -> terminee
export type ReservationStatus =
  | 'en_attente'
  | 'acceptee'
  | 'refusee'
  | 'annulee'
  | 'en_route'
  | 'arrivee'
  | 'terminee'
  | 'expiree';

export interface Reservation {
  id: string;
  trajetId: string;
  clientId: string;
  chauffeurId: string;
  nombrePlaces: number;
  prixTotal: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;     // set when transitioning to en_route
  completedAt?: string;   // set when transitioning to terminee
  reviewed?: boolean;     // true once the client submits a rating
  // Optional joined data
  clientName?: string;
  clientAvatar?: string;
  chauffeurName?: string;
  chauffeurAvatar?: string;
  villeDepart?: string;
  villeArrivee?: string;
  date?: string;
}

// Types pour les réservations d'hébergements
export interface HebergementReservation {
  id: string;
  hebergementId: string;
  clientId: string;
  hebergeurId: string;
  nombreNuits: number;
  prixTotal: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  clientAvatar?: string;
  hebergeurName?: string;
  hebergeurAvatar?: string;
  hebergementNom?: string;
  hebergementVille?: string;
}

// Types pour la messagerie directe
export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  reservationId?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

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
  marque?: string;
  modele?: string;
  couleur?: string;
}

// Types pour l'authentification et les rôles
export type UserRole = 'client' | 'chauffeur' | 'hebergeur';

// 'moto' is still valid for livraisons (livreur profiles, personal-vehicle
// list). For passenger voyages, only voiture/camionnette/bus are exposed.
export type VehicleType = 'moto' | 'velo' | 'voiture' | 'camionnette' | 'bus';

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
  disponibilite: number;
  images: string[];
  createdAt: string;
}

// Types pour les préférences de notifications push
export interface NotificationPreferences {
  courses: boolean;
  trajets: boolean;
  hebergements: boolean;
  promotions: boolean;
  messages: boolean;
}
export type NotificationCategory = keyof NotificationPreferences;

// Types pour les livraisons
export type LivraisonStatus =
  | 'en_attente'
  | 'acceptee'
  | 'refusee'
  | 'en_cours'
  | 'livree'
  | 'annulee'
  | 'expiree';

export interface Livraison {
  id: string;
  clientId: string;
  livreurId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  description?: string | null;
  prixEstime: number;
  status: LivraisonStatus;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional joined fields
  clientName?: string;
  clientAvatar?: string;
  livreurName?: string;
  livreurAvatar?: string;
}

// Annonces broadcast envoyées depuis l'admin web (table admin_messages)
export type AdminMessageTargetType = 'user' | 'role' | 'all';

export interface AdminMessage {
  id: string;
  senderName: string;
  targetType: AdminMessageTargetType;
  targetUserId?: string | null;
  targetRole?: UserRole | null;
  title: string;
  body: string;
  expiresAt?: string | null;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
}

// ─── Payments (migration 025) ───────────────────────────────────────

export type PaymentMethod = 'airtel_money' | 'moov_money' | 'paypal';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentRelatedType =
  | 'trajet_reservation'
  | 'hebergement_reservation'
  | 'livraison';

export type PaymentCurrency = 'XAF' | 'USD' | 'EUR';

export interface Payment {
  id: string;
  profileId: string;
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  providerRef: string | null;
  idempotencyKey: string;
  relatedType: PaymentRelatedType;
  relatedId: string;
  status: PaymentStatus;
  errorCode: string | null;
  errorMessage: string | null;
  payerPhone: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface InitiatePaymentParams {
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  relatedType: PaymentRelatedType;
  relatedId: string;
  /** E.164 phone for mobile-money methods. Ignored for PayPal. */
  payerPhone?: string;
  /** Client-generated UUID. Re-using the same key returns the existing payment. */
  idempotencyKey: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  status: PaymentStatus;
  /** PayPal approval URL (open in in-app browser) — null for mobile money. */
  redirectUrl?: string | null;
  /** Human-friendly message to show in the status modal. */
  message?: string;
}

// Utilisateur authentifié (peut être client, chauffeur ou hébergeur).
// `role` reste le rôle "actif" courant (celui qui pilote la tab bar et
// `clerkUser.unsafeMetadata.role`). `roles` est l'ensemble des rôles
// disponibles pour l'utilisateur (multi-role MVP, migration 023). Quand
// `roles` est absent (vieux profil persisté avant la migration), on
// retombe sur `[role]` côté lecture.
export interface AuthUser {
  id: string;
  role: UserRole;
  roles?: UserRole[];
  profile: UserInfo | ChauffeurProfile | HebergeurProfile;
}

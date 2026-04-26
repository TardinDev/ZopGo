/**
 * ZopGo Admin — Types miroirs du schéma Supabase
 * Alignés avec les migrations 001-017
 */

import type {
    UserRole,
    VehicleType,
    TripStatus,
    DeliveryStatus,
    TrajetStatus,
    LivraisonStatus,
    ReservationStatus,
    HebergementType,
    HebergementStatus,
    PaymentMethod,
    PackageSize,
    AuditAction,
    AdminMessageTargetType,
    NotificationRecipientRole,
} from "./enums";

// ─── Profiles ────────────────────────────────────────────
export interface DbProfile {
    id: string; // uuid
    clerk_id: string | null;
    role: UserRole;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    rating: number;
    total_trips: number;
    total_deliveries: number;
    disponible: boolean;
    push_token: string | null;
    notification_preferences: {
        courses: boolean;
        trajets: boolean;
        hebergements: boolean;
        promotions: boolean;
        messages: boolean;
    };
    member_since: string;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Vehicles ────────────────────────────────────────────
export interface DbVehicle {
    id: string;
    owner_id: string;
    type: VehicleType;
    label: string;
    brand: string;
    model: string;
    plate_number: string;
    year: number | null;
    color: string;
    is_active: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Trips (legacy ZopRide, conservé pour audit_log historique) ──
export interface DbTrip {
    id: string;
    client_id: string;
    driver_id: string | null;
    vehicle_id: string | null;
    status: TripStatus;
    from_address: string;
    to_address: string;
    from_lat: number | null;
    from_lng: number | null;
    to_lat: number | null;
    to_lng: number | null;
    distance_km: number | null;
    duration_min: number | null;
    price: number;
    payment_method: PaymentMethod;
    rating: number | null;
    comment: string | null;
    started_at: string | null;
    completed_at: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    client?: DbProfile;
    driver?: DbProfile;
}

// ─── Deliveries (legacy ZopDelivery, conservé pour audit_log historique) ──
export interface DbDelivery {
    id: string;
    client_id: string;
    driver_id: string | null;
    vehicle_id: string | null;
    status: DeliveryStatus;
    pickup_address: string;
    dropoff_address: string;
    pickup_lat: number | null;
    pickup_lng: number | null;
    dropoff_lat: number | null;
    dropoff_lng: number | null;
    package_description: string;
    package_size: PackageSize;
    distance_km: number | null;
    price: number;
    payment_method: PaymentMethod;
    rating: number | null;
    comment: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    client?: DbProfile;
    driver?: DbProfile;
}

// ─── Trajets (voyages inter-villes) — migrations 001, 002, 010, 012 ──
export interface DbTrajet {
    id: string;
    chauffeur_id: string;
    ville_depart: string;
    ville_arrivee: string;
    prix: number;
    vehicule: string;
    date: string | null;
    places_disponibles: number;
    status: TrajetStatus;
    deleted_at: string | null;
    created_at: string;
    chauffeur?: DbProfile;
}

// ─── Livraisons — migration 016 ─────────────────────────
export interface DbLivraison {
    id: string;
    client_id: string;
    livreur_id: string;
    pickup_location: string;
    dropoff_location: string;
    pickup_lat: number | null;
    pickup_lng: number | null;
    dropoff_lat: number | null;
    dropoff_lng: number | null;
    description: string | null;
    prix_estime: number;
    status: LivraisonStatus;
    accepted_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    client?: DbProfile;
    livreur?: DbProfile;
}

// ─── Hébergements — migrations 007, 009, 011 ────────────
export interface DbHebergement {
    id: string;
    hebergeur_id: string;
    nom: string;
    type: HebergementType;
    ville: string;
    adresse: string;
    prix_par_nuit: number;
    capacite: number;
    description: string;
    status: HebergementStatus;
    disponibilite: number;
    images: string[];
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    hebergeur?: DbProfile;
}

// ─── Réservations trajet — migration 012 ────────────────
export interface DbReservation {
    id: string;
    trajet_id: string;
    client_id: string;
    chauffeur_id: string;
    nombre_places: number;
    prix_total: number;
    status: ReservationStatus;
    created_at: string;
    updated_at: string;
    trajet?: DbTrajet;
    client?: DbProfile;
    chauffeur?: DbProfile;
}

// ─── Réservations hébergement — migration 014 ───────────
export interface DbHebergementReservation {
    id: string;
    hebergement_id: string;
    client_id: string;
    hebergeur_id: string;
    nombre_nuits: number;
    prix_total: number;
    status: ReservationStatus;
    created_at: string;
    updated_at: string;
    hebergement?: DbHebergement;
    client?: DbProfile;
    hebergeur?: DbProfile;
}

// ─── Direct messages (entre users) — migration 013 ──────
export interface DbDirectMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    reservation_id: string | null;
    content: string;
    read: boolean;
    created_at: string;
    sender?: DbProfile;
    receiver?: DbProfile;
}

// ─── Admin messages (broadcast admin → users) — migration 018 (à venir) ──
export interface DbAdminMessage {
    id: string;
    sender_clerk_id: string;
    sender_name: string;
    target_type: AdminMessageTargetType;
    target_user_id: string | null;
    target_role: UserRole | null;
    title: string;
    body: string;
    push_sent: boolean;
    expires_at: string | null;
    created_at: string;
    target_user?: DbProfile;
    read_count?: number;
}

export interface DbAdminMessageRead {
    message_id: string;
    user_id: string;
    read_at: string;
}

// ─── Notifications ───────────────────────────────────────
export interface DbNotification {
    id: string;
    recipient_id: string | null;
    recipient_role: NotificationRecipientRole | null;
    type: string;
    title: string;
    message: string;
    icon: string;
    icon_color: string;
    icon_bg: string;
    read: boolean;
    data: Record<string, unknown>;
    deleted_at: string | null;
    created_at: string;
}

// ─── Audit Log ───────────────────────────────────────────
export interface DbAuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action: AuditAction;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    performed_by: string | null;
    performed_at: string;
}

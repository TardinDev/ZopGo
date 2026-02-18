/**
 * ZopGo Admin — Types miroirs du schéma Supabase
 * Alignés avec les migrations 001-005
 */

import type {
    UserRole,
    VehicleType,
    TripStatus,
    DeliveryStatus,
    TrajetStatus,
    PaymentMethod,
    PackageSize,
    AuditAction,
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
        promotions: boolean;
    };
    member_since: string; // ISO timestamp
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

// ─── Trips (courses ZopRide) ─────────────────────────────
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
    // Joined relations (optional, via meta.select)
    client?: DbProfile;
    driver?: DbProfile;
}

// ─── Deliveries (livraisons ZopDelivery) ─────────────────
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
    // Joined relations
    client?: DbProfile;
    driver?: DbProfile;
}

// ─── Trajets (voyages inter-villes ZopTravel) ────────────
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
    // Joined relations
    chauffeur?: DbProfile;
}

// ─── Notifications ───────────────────────────────────────
export interface DbNotification {
    id: string;
    recipient_id: string | null;
    recipient_role: "client" | "chauffeur" | "all" | null;
    type: string;
    title: string;
    message: string;
    icon: string;
    icon_color: string;
    icon_bg: string;
    read: boolean;
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

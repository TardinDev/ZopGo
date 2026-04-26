/**
 * ZopGo Admin — Enums alignés avec les contraintes DB (migrations 001-017)
 */

export type UserRole = "client" | "chauffeur" | "hebergeur";

export type AdminRole = "admin";

export type VehicleType = "moto" | "velo" | "voiture" | "camionnette";

export type TripStatus =
    | "pending"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled";

export type DeliveryStatus =
    | "pending"
    | "accepted"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "cancelled";

export type TrajetStatus = "en_attente" | "effectue" | "complet";

export type LivraisonStatus =
    | "en_attente"
    | "acceptee"
    | "refusee"
    | "en_cours"
    | "livree"
    | "annulee"
    | "expiree";

export type ReservationStatus = "en_attente" | "acceptee" | "refusee" | "annulee";

export type HebergementType = "hotel" | "auberge" | "appartement" | "maison" | "chambre";

export type HebergementStatus = "actif" | "inactif";

export type PaymentMethod = "cash" | "mobile_money" | "card";

export type PackageSize = "small" | "medium" | "large" | "extra_large";

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export type AdminMessageTargetType = "user" | "role" | "all";

export type NotificationRecipientRole = "client" | "chauffeur" | "hebergeur" | "all";

/**
 * ZopGo Admin — Enums alignés avec les contraintes DB
 */

export type UserRole = "client" | "chauffeur";

export type AdminRole = "admin" | "super_admin";

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

export type TrajetStatus = "en_attente" | "effectue";

export type PaymentMethod = "cash" | "mobile_money" | "card";

export type PackageSize = "small" | "medium" | "large" | "extra_large";

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

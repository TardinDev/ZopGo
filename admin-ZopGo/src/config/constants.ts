/**
 * ZopGo Admin — Constantes globales
 */

// Dark theme palette (inspired by Dribbble HR Dashboard — Zeyox Studio)
export const DARK = {
    pageBg: "#13112B",
    cardBg: "#1C1B2E",
    cardBgHover: "#252440",
    accent: "#7C5CFC",
    accentLight: "rgba(124, 92, 252, 0.15)",
    textPrimary: "#FFFFFF",
    textSecondary: "#8B8BA3",
    textMuted: "#555573",
    border: "rgba(255, 255, 255, 0.06)",
    success: "#10B981",
    error: "#EF4444",
} as const;

// Palette de couleurs ZopGo
export const COLORS = {
    primary: "#7C5CFC",
    primaryDark: "#5B3FD6",
    primaryLight: "rgba(124, 92, 252, 0.15)",
    secondary: "#4facfe",
    secondaryLight: "#00f2fe",
    yellow: "#FFDD5C",
    orange: "#F59E0B",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    gray: {
        50: "#F9FAFB",
        100: "#F3F4F6",
        200: "#E5E7EB",
        300: "#D1D5DB",
        400: "#9CA3AF",
        500: "#6B7280",
        600: "#4B5563",
        700: "#374151",
        800: "#1F2937",
        900: "#111827",
    },
} as const;

// Design tokens — Sidebar
export const SIDEBAR = {
    bg: DARK.cardBg,
    bgHover: DARK.cardBgHover,
    text: DARK.textSecondary,
    textActive: DARK.textPrimary,
    accent: DARK.accent,
    border: DARK.border,
    width: 260,
    collapsedWidth: 80,
} as const;

// Shadows (subtle for dark theme)
export const SHADOWS = {
    sm: "0 1px 2px rgba(0, 0, 0, 0.2)",
    md: "0 4px 12px rgba(0, 0, 0, 0.25)",
    lg: "0 8px 25px rgba(0, 0, 0, 0.3)",
    header: "0 1px 3px rgba(0, 0, 0, 0.2)",
} as const;

// Devise
export const CURRENCY = "FCFA";
export const CURRENCY_LOCALE = "fr-FR";

/**
 * Formate un prix en FCFA
 * @example formatPrice(15000) → "15 000 FCFA"
 */
export function formatPrice(amount: number | null | undefined): string {
    if (amount == null) return "—";
    return `${amount.toLocaleString(CURRENCY_LOCALE)} ${CURRENCY}`;
}

// Villes du Gabon
export const GABON_CITIES = [
    "Libreville",
    "Port-Gentil",
    "Franceville",
    "Oyem",
    "Moanda",
    "Mouila",
    "Lambaréné",
    "Tchibanga",
    "Koulamoutou",
    "Makokou",
    "Bitam",
    "Lastoursville",
    "Ntoum",
    "Okondja",
    "Booué",
] as const;

// Labels lisibles pour les statuts
export const TRIP_STATUS_LABELS: Record<string, string> = {
    pending: "En attente",
    accepted: "Accepté",
    in_progress: "En cours",
    completed: "Terminé",
    cancelled: "Annulé",
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
    pending: "En attente",
    accepted: "Accepté",
    picked_up: "Récupéré",
    in_transit: "En transit",
    delivered: "Livré",
    cancelled: "Annulé",
};

export const TRAJET_STATUS_LABELS: Record<string, string> = {
    en_attente: "En attente",
    effectue: "Effectué",
};

export const USER_ROLE_LABELS: Record<string, string> = {
    client: "Client",
    chauffeur: "Chauffeur",
};

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
    moto: "Moto",
    velo: "Vélo",
    voiture: "Voiture",
    camionnette: "Camionnette",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: "Espèces",
    mobile_money: "Mobile Money",
    card: "Carte",
};

// Couleurs par statut pour les tags
export const STATUS_COLORS: Record<string, string> = {
    pending: "orange",
    accepted: "blue",
    in_progress: "processing",
    completed: "green",
    cancelled: "red",
    picked_up: "cyan",
    in_transit: "geekblue",
    delivered: "green",
    en_attente: "orange",
    effectue: "green",
};

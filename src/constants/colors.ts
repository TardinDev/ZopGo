/**
 * Palette de couleurs de l'application ZopGo
 * Utiliser ces constantes au lieu de valeurs codées en dur
 */

export const COLORS = {
  // Couleurs principales
  primary: '#2162FE',
  primaryDark: '#1E40AF',
  secondary: '#4facfe',
  secondaryLight: '#00f2fe',

  // Couleurs d'accent
  yellow: '#FFDD5C',
  yellowLight: '#FFE89A',
  orange: '#F59E0B',
  orangeDark: '#D97706',

  // Couleurs de statut
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Nuances de gris
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Couleurs de gradient
  gradients: {
    blue: ['#3B82F6', '#2563EB'],
    orange: ['#F59E0B', '#D97706'],
    yellow: ['#FFDD5C', '#FFE89A'],
    purple: ['#667eea', '#764ba2'],
    cyan: ['#4facfe', '#00f2fe'],
  },

  // Couleurs avec transparence
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

// Type helper pour auto-complétion
export type ColorKey = keyof typeof COLORS;

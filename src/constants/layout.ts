/**
 * Constantes de layout et dimensionnement
 */

export const LAYOUT = {
  // Padding et marges
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Rayons de bordure
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    xxlarge: 24,
    round: 28,
    full: 9999,
  },

  // Tailles d'icônes
  iconSize: {
    xs: 14,
    small: 16,
    medium: 20,
    large: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  // Tailles de police
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Hauteurs de composants
  heights: {
    button: 48,
    input: 48,
    tabBar: 72,
    header: 60,
  },

  // Largeurs
  widths: {
    statCard: 160, // 40 * 4 = 160
    maxContent: 768,
  },

  // Ombres (boxShadow CSS - remplace les styles legacy shadowColor/elevation)
  shadows: {
    small: {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
    },
    medium: {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.10)',
    },
    large: {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    },
    xl: {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
    },
  },
} as const;

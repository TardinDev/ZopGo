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

  // Ombres
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 16,
    },
  },
} as const;

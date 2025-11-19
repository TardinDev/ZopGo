/**
 * Configurations d'animations réutilisables
 */

export const SPRING_CONFIG = {
  default: {
    damping: 50,
    stiffness: 400,
  },
  slow: {
    damping: 60,
    stiffness: 200,
  },
  fast: {
    damping: 40,
    stiffness: 600,
  },
  bouncy: {
    damping: 15,
    stiffness: 400,
  },
} as const;

export const GESTURE_THRESHOLDS = {
  VELOCITY: 500,
  SWIPE_MIN: 50,
  MIDDLE_SNAP: 0.5,
} as const;

export const TIMING_CONFIG = {
  quick: { duration: 150 },
  normal: { duration: 300 },
  slow: { duration: 500 },
} as const;

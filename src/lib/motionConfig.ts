/**
 * Centralized Spring Motion Configurations
 * Standardized stiffness and damping values for physical consistency.
 */

export const SPRING_PRESETS = {
  fast: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30
  },
  medium: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 25
  },
  slow: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 22
  }
} as const;

export type SpringPreset = keyof typeof SPRING_PRESETS;

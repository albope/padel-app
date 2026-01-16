/**
 * Haptic feedback utilities for mobile devices
 * Uses the Vibration API when available
 */

// Check if vibration API is supported
const isVibrationSupported = () => {
  return 'vibrate' in navigator;
};

// Vibration patterns (in milliseconds)
const PATTERNS = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  error: [20, 50, 20, 50, 20],
  warning: [15, 30, 15],
  selection: 5,
};

/**
 * Trigger a haptic feedback
 * @param {string} type - Type of haptic feedback (light, medium, heavy, success, error, warning, selection)
 * @param {boolean} force - Force vibration even if user preferences might be against it
 */
export const haptic = (type = 'light', force = false) => {
  if (!isVibrationSupported()) {
    return;
  }

  // Check if user has reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion && !force) {
    return;
  }

  const pattern = PATTERNS[type] || PATTERNS.light;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn('Vibration API error:', error);
  }
};

/**
 * Trigger a light tap feedback (for UI interactions)
 */
export const hapticLight = () => haptic('light');

/**
 * Trigger a medium feedback (for confirmations)
 */
export const hapticMedium = () => haptic('medium');

/**
 * Trigger a heavy feedback (for important actions)
 */
export const hapticHeavy = () => haptic('heavy');

/**
 * Trigger a success pattern (for completed actions)
 */
export const hapticSuccess = () => haptic('success');

/**
 * Trigger an error pattern (for errors or cancellations)
 */
export const hapticError = () => haptic('error');

/**
 * Trigger a warning pattern (for warnings)
 */
export const hapticWarning = () => haptic('warning');

/**
 * Trigger a selection feedback (for selecting items)
 */
export const hapticSelection = () => haptic('selection');

/**
 * Cancel any ongoing vibration
 */
export const hapticCancel = () => {
  if (isVibrationSupported()) {
    navigator.vibrate(0);
  }
};

export default {
  haptic,
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticError,
  hapticWarning,
  hapticSelection,
  hapticCancel,
  isSupported: isVibrationSupported,
};

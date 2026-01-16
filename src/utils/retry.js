// src/utils/retry.js

/**
 * Retry utility with exponential backoff
 * Retries a function multiple times with increasing delays between attempts
 */

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {number} options.backoffFactor - Multiplier for delay between attempts (default: 2)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @param {Function} options.onRetry - Callback called before each retry attempt
 * @returns {Promise} - Result of the function call
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry = null,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        console.error(`All ${maxAttempts} retry attempts failed:`, error);
        throw error;
      }

      // Log retry attempt
      console.warn(`Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`, error.message);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, delay, error);
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Determine if a Firebase error should be retried
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error should be retried
 */
export function shouldRetryFirebaseError(error) {
  // Don't retry client errors or authentication errors
  const nonRetryableCodes = [
    'permission-denied',
    'unauthenticated',
    'invalid-argument',
    'not-found',
    'already-exists',
  ];

  // Check if error has a code property (Firebase errors)
  if (error.code && nonRetryableCodes.includes(error.code)) {
    return false;
  }

  // Retry network errors, timeout errors, and server errors
  const retryableErrors = [
    'unavailable',
    'deadline-exceeded',
    'aborted',
    'resource-exhausted',
    'internal',
    'unknown',
  ];

  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }

  // Retry network errors
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('timeout') ||
    error.message.includes('Failed to fetch')
  )) {
    return true;
  }

  // Default: retry unknown errors
  return true;
}

/**
 * Retry a Firebase operation with appropriate defaults
 * @param {Function} fn - Async Firebase function to retry
 * @param {Object} options - Optional retry options (overrides defaults)
 * @returns {Promise} - Result of the function call
 */
export function retryFirebaseOperation(fn, options = {}) {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
    shouldRetry: shouldRetryFirebaseError,
    ...options,
  });
}

export default {
  retryWithBackoff,
  retryFirebaseOperation,
  shouldRetryFirebaseError,
};

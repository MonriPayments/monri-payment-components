// Centralized error messages for consistency
export const ERROR_MESSAGES = {
  PAYMENT_METHOD_NOT_SET: 'payment_method is required',
  INVALID_PAYMENT_METHOD: 'Expected payment_method to be "mastercard-click-to-pay"',
  INVALID_DATA: 'data object is required',
  LOCALE_NOT_SET: 'data.locale is required and must be a string',
  ENV_NOT_SET: 'data.environment is required for non-test mode',
  INVALID_ENVIRONMENT: 'data.environment must be "production" or "sandbox"',
  COMPONENT_NOT_READY: 'Component not ready yet',
  SCRIPT_LOAD_FAILED: 'Failed to load required scripts',
  AUTHENTICATION_FAILED: 'Authentication process failed',
  MASTERCARD_NOT_INITIALIZED: 'Mastercard Click to Pay not initialized',
  CARD_DATA_NOT_READY: 'Card data not ready for encryption',
  CARD_NOT_ENCRYPTED: 'Card not encrypted for checkout'
} as const;

export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
export interface ApplePayButtonStyle {
  buttonStyle: 'black' | 'white' | 'white-outline';
  buttonType:
    | 'plain'
    | 'buy'
    | 'donate'
    | 'checkout'
    | 'book'
    | 'subscribe'
    | 'reload'
    | 'add-money'
    | 'top-up'
    | 'order'
    | 'rent'
    | 'support'
    | 'contribute'
    | 'tip';
  locale: string;
}

export interface ApplePayButtonConfig {
  countryCode: string;
  currencyCode: string;
  total: {
    label: string;
    amount: string;
  };
  supportedNetworks: string[];
  merchantCapabilities: string[];
}

export enum MessageType {
  SET_INPUT = 'SET_INPUT',
  START_APPLE_PAY_SESSION = 'START_APPLE_PAY_SESSION',
  MERCHANT_VALIDATION_RESULT = 'MERCHANT_VALIDATION_RESULT',
  MERCHANT_VALIDATION_ERROR = 'MERCHANT_VALIDATION_ERROR',
  PAYMENT_RESULT = 'PAYMENT_RESULT',
  VALIDATE_MERCHANT = 'VALIDATE_MERCHANT',
  PAYMENT_AUTHORIZED = 'PAYMENT_AUTHORIZED'
}

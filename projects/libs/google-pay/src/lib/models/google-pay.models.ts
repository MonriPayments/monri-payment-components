export interface GoogleTransactionInfo {
  displayItems?: { label: string, type: string, price: string }[] | undefined;
  countryCode: string;
  currencyCode: string;
  totalPriceStatus: string;
  totalPrice: string;
  totalPriceLabel?: string | undefined;
}

export interface GooglePaymentDataRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: {
    type: string;
    parameters: {
      allowedAuthMethods: string[];
      allowedCardNetworks: string[];
    };
    tokenizationSpecification: {
      type: string;
      parameters: {
        gateway: string;
        gatewayMerchantId: string;
      };
    };
  }[];
  transactionInfo: GoogleTransactionInfo;
  merchantInfo: { merchantId: string, merchantName: string };
  callbackIntents?: string[];
}

export interface GoogleIsReadyToPayRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: {
    type: string;
    parameters: {
      allowedAuthMethods: string[];
      allowedCardNetworks: string[];
    };
  }[];
}

export interface GoogleErrorState {
  intent?: string | undefined;
  message: string;
  reason: string;
}

export interface GoogleTransactionState {
  onSuccess: string;
  onError: string;
}

export enum MessageType {
  SET_INPUT = 'SET_INPUT',
  START_GOOGLE_PAY_SESSION = 'START_GOOGLE_PAY_SESSION',
  MERCHANT_VALIDATION_ERROR = 'MERCHANT_VALIDATION_ERROR',
  PAYMENT_RESULT = 'PAYMENT_RESULT',
  SECURE_MESSAGE_RESULT = 'SECURE_MESSAGE_RESULT',
  PAYMENT_AUTHORIZED = 'PAYMENT_AUTHORIZED'
}

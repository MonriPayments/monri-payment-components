export interface GoogleTransactionInfo {
  displayItems: { label: string, type: string, price: string }[];
  countryCode: string;
  currencyCode: string;
  totalPriceStatus: string;
  totalPrice: string;
  totalPriceLabel: string;
}

export interface GooglePaymentDataRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: any[];
  transactionInfo: GoogleTransactionInfo;
  merchantInfo: { merchantId: string, merchantName: string };
  callbackIntents: string[];
}

export interface GoogleIsReadyToPayRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: any[];
}

export interface GoogleErrorState {
  intent: string;
  message: string;
  reason: string;
}

export interface GoogleTransactionState {
  onSuccess: string;
  onError: string;
}

import {
  GoogleErrorState,
  GooglePaymentDataRequest,
  GoogleTransactionInfo,
  GoogleTransactionState
} from "../models/google-pay.models";

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): any;

  newTransaction(params: NewCardTransactionRequest, env: string): any;
}

export type StartPaymentRequest = {
  payment_method: string;
  environment: string;
  is_test?: boolean;
  data: { [k: string]: string };
};

export type StartPaymentResponse = {
  status: string;
  product: string;
  acquirer: string;
  input_timeout: number;

  country_code: string;
  currency_code: string;
  supported_networks: string[];
  merchant_capabilities: string[];
  total: { label: string; amount: string; };

  // allowedPaymentMethods: any,
  // transactionInfo: any
  // merchantInfo: any
  // callbackIntents: any
  allowedPaymentMethods: GooglePaymentDataRequest['allowedPaymentMethods'][number];
  transactionInfo: GoogleTransactionInfo
  merchantInfo: GooglePaymentDataRequest['merchantInfo'];
  callbackIntents: GooglePaymentDataRequest['callbackIntents'];
  googleErrorState?: GoogleErrorState;
  googleTransactionState?: GoogleTransactionState;
};

export type NewCardTransactionRequest = {
  transaction: {
    trx_token: string;
    language: string;
    ch_full_name: string;
    ch_address: string;
    ch_city: string;
    ch_zip: string;
    ch_country: string;
    ch_phone: string;
    ch_email: string;
    meta: any;
    payment_method_type: string;
    payment_method_data: any;
  };
};

export enum TransactionStatus  {
  approved = 'approved',
  declined = 'declined',
}

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): any;

  validateMerchant(params: MerchantValidateRequest): any;

  newTransaction(params: NewCardTransactionRequest, env: string): any;
}

export type StartPaymentRequest = {
  payment_method: string;
  is_test?: boolean;
  data: { [k: string]: string };
};

export type StartPaymentResponse = {
  status: string;
  country_code: string;
  currency_code: string;
  supported_networks: string[];
  merchant_capabilities: string[];
  total: { label: string; amount: string; };
};

export type MerchantValidateRequest = {
  data: { [k: string]: string };
  validation_url: string;
  initiative_context: any;
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

export enum TransactionStatus {
  approved = 'approved',
  declined = 'declined',
}

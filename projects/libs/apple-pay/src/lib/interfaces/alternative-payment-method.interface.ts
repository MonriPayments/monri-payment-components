export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): any;

  validateMerchant(params: MerchantValidateRequest): any;

  newTransaction(params: NewCardTransactionRequest): any;
}

export type StartPaymentRequest = {
  payment_method: string;
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
};

export type MerchantValidateRequest = {
  data: { [k: string]: string };
  validation_url: string;
  initiative_context: any;
};

export type NewCardTransactionRequest = {
  transaction: {
    data: { [k: string]: string };
    payment_method_type: any;
    payment_method_data: any;
  },
};

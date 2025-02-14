import {Observable} from 'rxjs';

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): any;
}

export type StartPaymentRequest = {
  payment_method: string;
  is_test?: boolean;
  data: { [k: string]: string };
  validation_url?: string;
};

export type StartPaymentResponse = {
  status: string;
  product: string;
  acquirer: string;
  input_timeout: number;
};

export type ValidateMerchantRequest = {
  data: { [k: string]: string };
  validation_url: string;
};

export type NewCardTransactionRequest = {
  transaction: {
    payment_method_type: string | 'apple-pay',
    payment_method_data: any
  }
}

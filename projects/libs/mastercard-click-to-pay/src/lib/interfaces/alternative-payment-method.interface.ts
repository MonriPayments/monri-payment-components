import { Observable } from 'rxjs';

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): Observable<StartPaymentResponse>;
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

  checkout_url?: string;
  session_id?: string;
  locale?: string;

  button_style?: string;
  [key: string]: any;
};

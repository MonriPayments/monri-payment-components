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
  input_timeout: number;
  qr_text: {
    qr_type: string;
    cid: string;
    tid: string;
    bill_id: number;
    amount: string;
    currency: string;
  };
};

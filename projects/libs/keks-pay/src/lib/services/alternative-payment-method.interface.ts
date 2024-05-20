import { Observable } from 'rxjs';

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): Observable<StartPaymentResponse>;
}

export type StartPaymentRequest = {
  payment_method: string;
  data: { [k: string]: string };
};

export type StartPaymentResponse = {
  status: string;
  qr_code_text?: string;
};

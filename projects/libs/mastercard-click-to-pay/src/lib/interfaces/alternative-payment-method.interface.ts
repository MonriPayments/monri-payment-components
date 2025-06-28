import { Observable } from 'rxjs';
import {
  DpaData,
  DpaTransactionOptions
} from './mastercard-click-to-pay.interface';

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): Observable<StartPaymentResponse>;
}

export type StartPaymentRequest = {
  payment_method: string;
  is_test?: boolean;
  data: {
    [k: string]: any;
  };
};

export type StartPaymentResponse = {
  srcDpaId: string;
  dpaData: DpaData;
  dpaTransactionOptions: DpaTransactionOptions;
  cardBrands: Array<string>;
};

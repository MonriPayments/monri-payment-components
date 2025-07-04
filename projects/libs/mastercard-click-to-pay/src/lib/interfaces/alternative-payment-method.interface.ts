import { Observable } from 'rxjs';
import {
  DpaData,
  DpaTransactionOptions
} from './mastercard-click-to-pay.interface';

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): Observable<StartPaymentResponse>;
}

export interface StartPaymentData {
  locale: string;
  environment?: 'production' | 'sandbox';
  darkTheme?: boolean;
  ch_email?: string;
  ch_phone?: string;
  mobileNumber?: string | { phoneNumber: string; countryCode: string; };
  firstName?: string;
  lastName?: string;
  encryptCardParams?: unknown;
  production?: boolean;
  [key: string]: unknown; // Allow additional properties but avoid `any`
}

export type StartPaymentRequest = {
  payment_method: string;
  is_test?: boolean;
  data: StartPaymentData;
};

export type StartPaymentResponse = {
  srcDpaId: string;
  dpaData: DpaData;
  dpaTransactionOptions: DpaTransactionOptions;
  cardBrands: Array<string>;
};

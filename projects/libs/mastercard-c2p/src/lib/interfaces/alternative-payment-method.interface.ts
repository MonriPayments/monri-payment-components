import { Observable } from 'rxjs';
import {
  DpaData,
  DpaTransactionOptions
} from './mastercard-c2p.interface';

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): Observable<StartPaymentResponse>;

  newTransaction(
    params: NewCardTransactionRequest,
    env: string | undefined
  ): unknown;
}

export interface StartPaymentData {
  locale: string;
  language: string;
  environment?: 'production' | 'sandbox';
  ch_full_name?: string;
  darkTheme?: boolean;
  ch_email?: string;
  ch_phone?: string;
  ch_address?: string;
  ch_city?: string;
  ch_zip?: string;
  ch_country?: string;
  mobileNumber?: string | { phoneNumber: string; countryCode: string };
  firstName?: string;
  lastName?: string;
  encryptCardParams?: unknown;
  production?: boolean;
  [key: string]: unknown; // Allow additional properties but avoid `any`
}

export type StartPaymentRequest = {
  trx_token: string;
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
    meta: unknown;
    payment_method_type: string;
    payment_method_data: unknown;
  };
};

export enum TransactionStatus {
  approved = 'approved',
  declined = 'declined'
}

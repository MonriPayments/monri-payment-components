import { Observable } from 'rxjs';

export interface AlternativePaymentMethodInterface {
  startPayment(params: StartPaymentRequest): Observable<StartPaymentResponse>;
}

export type StartPaymentRequest = {
  payment_method: string;
  is_test?: boolean;
  data: {
    darkTheme?: boolean;
    locale: string;
    srcDpaId: string;
    environment?: string;
    consumer?: {
      email?: string;
      mobileNumber?: {
        phoneNumber: string;
        countryCode: string;
      };
      firstName?: string;
      lastName?: string;
    };
    encryptCardParams?: {
      primaryAccountNumber: string;
      panExpirationMonth: string;
      panExpirationYear: string;
      cardSecurityCode: string;
    };
    [k: string]: any;
  };
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

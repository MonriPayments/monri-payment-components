import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {StartPaymentRequest, StartPaymentResponse} from '../interfaces/alternative-payment-method.interface';

@Injectable({providedIn: 'root'})
export class WebPayService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  get httpClient(): HttpClient {
    return this._httpClient;
  }

  startPayment(req: StartPaymentRequest): Observable<StartPaymentResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<StartPaymentResponse>(
      `/v2/direct-payment/apple-pay/${req.data['trx_token']}/start-payment`,
      JSON.stringify({}),
      {headers}
    );
  }

  validateMerchant(req: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(
      `/v2/apple-pay/${req.data['trx_token']}/validate-merchant`,
      JSON.stringify({validationURL: req.validation_url}),
      {headers}
    );
  }

  newTransaction(event: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(
      `/v2/transaction`,
      JSON.stringify(
        {
          payment_method_type: 'apple-pay',
          payment_method_data: event.payment.token
        }
      ),
      {headers}
    );
  }
}

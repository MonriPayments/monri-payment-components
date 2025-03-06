import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  MerchantValidateRequest,
  NewCardTransactionRequest,
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';

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
      `/v2/apple-pay/${req.data['trx_token']}/start-payment`,
      JSON.stringify({}),
      {headers}
    );
  }

  validateMerchant(req: MerchantValidateRequest): Observable<StartPaymentResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(
      `/v2/apple-pay/${req.data['trx_token']}/merchant-validate`,
      JSON.stringify({
        validationURL: req.validation_url,
        initiative_context: window.location.hostname
      }),
      {headers}
    );
  }

  newTransaction(req: NewCardTransactionRequest) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(
      `/v2/transaction`,
      JSON.stringify(
        {
          data: req.transaction.data,
          payment_method_type: 'apple-pay',
          payment_method_data: req.transaction.payment_method_data
        }
      ),
      {headers}
    );
  }
}

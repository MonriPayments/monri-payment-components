import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
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
      `/v2/google-pay/${req.data['trx_token']}/start-payment`,
      JSON.stringify({}),
      {headers}
    );
  }

  newTransaction(req: NewCardTransactionRequest) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(
      `/v2/transaction`,
      JSON.stringify(req),
      {headers}
    );
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NewCardTransactionRequest,
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';

@Injectable({ providedIn: 'root' })
export class WebPayService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  startPayment(req: StartPaymentRequest): Observable<StartPaymentResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // url had http://localhost:3000 at the start, but should work without it
    // add it if the post is not successful (only in test env)
    return this.httpClient.post<StartPaymentResponse>(
      `/v2/mastercard-c2p/${req.data['trx_token']}/start-payment`,
      JSON.stringify({}),
      { headers }
    );
  }

  newTransaction(
    req: NewCardTransactionRequest,
    env: string | undefined
  ): Observable<unknown> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    let hostname = 'ipgtest';
    if (env) {
      hostname = env === 'test' ? 'ipgtest' : 'ipg';
    }

    return this.httpClient.post<unknown>(
      `https://${hostname}.monri.com/v2/transaction`,
      JSON.stringify(req),
      { headers }
    );
  }

  get httpClient(): HttpClient {
    return this._httpClient;
  }
}

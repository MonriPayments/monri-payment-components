import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import {
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';

@Injectable({ providedIn: 'root' })
export class WebPayService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  startPayment(req: StartPaymentRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    //TODO: remove localhost
    return this.httpClient.post(
      `http://localhost:3000/v2/direct-payment/keks-pay-hr/${req.data['trx_token']}/start-payment`,
      JSON.stringify({}),
      { headers }
    );
  }

  get httpClient(): HttpClient {
    return this._httpClient;
  }
}

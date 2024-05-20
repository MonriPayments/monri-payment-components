import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  StartPaymentRequest,
  StartPaymentResponse
} from './alternative-payment-method.interface';

@Injectable({ providedIn: 'root' })
export class WebPayService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  startPayment(req: StartPaymentRequest): Observable<StartPaymentResponse> {
    return of({ status: 'approved', qr_code_text: 'https://monri.com' });
  }

  get httpClient(): HttpClient {
    return this._httpClient;
  }
}

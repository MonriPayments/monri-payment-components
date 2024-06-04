import {
  inject,
  Injectable,
} from '@angular/core';
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
    const mockResponse = {
      acquirer: 'keks-pay-hr',
      acquirer_name: 'KeksPay',
      issuer: 'keks-pay-hr',
      tacq: 'keks-pay-hr/23',
      mid: 'P0011234',
      tid: 'P0011234',
      authenticity_token: null,
      systan: 212,
      approval_code: null,
      reference_number: 1963072,
      acquirer_response_code: 'N/A',
      acquirer_response_message: 'N/A',
      response_code: '0100',
      response_message: 'transaction pending',
      status: 'pending',
      transaction_type: 'direct_payment',
      qr_text:
        '{"qr_type":"1","cid":"P0011234","tid":"P0011234","bill_id":1963072,"amount":"1.00","currency":"EUR"}',
      custom: {},
      uuid: '7d2e2bd0-153f-4b47-921e-ed5c45d595a2',
      input_timeout: 90,
      fadeout_timeout: 30
    };

    return of({ status: 'approved', qr_text: mockResponse.qr_text });
  }

  get httpClient(): HttpClient {
    return this._httpClient;
  }
}

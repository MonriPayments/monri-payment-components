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
    const hostname = req.data['environment'] === 'test' ? 'ipgtest' : 'ipg'
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<StartPaymentResponse>(
      `https://${hostname}.monri.com/v2/apple-pay/${req.data['trx_token']}/start-payment`,
      JSON.stringify({}),
      {headers}
    );
  }

  validateMerchant(req: MerchantValidateRequest): Observable<StartPaymentResponse> {
    const hostname = req.data['environment'] === 'test' ? 'ipgtest' : 'ipg'
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(
      `https://${hostname}.monri.com/v2/apple-pay/${req.data['trx_token']}/merchant-validate`,
      JSON.stringify({
        validationURL: req.validation_url,
        initiative_context: window.location.hostname
      }),
      {headers}
    );
  }

  newTransaction(req: NewCardTransactionRequest, env: string): Observable<any> {
    const hostname = env === 'test' ? 'ipgtest' : 'ipg'
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(
      `https://${hostname}.monri.com/v2/transaction`,
      JSON.stringify(req),
      {headers}
    );
  }
}

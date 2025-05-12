import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
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
    // req.data['environment'] === 'test' ? 'ipgtest' : 'ipg' ??
    const hostname = 'ipgtest'
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
    // req.data['environment'] === 'test' ? 'ipgtest' : 'ipg' ??
    const hostname = 'ipgtest'
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (req.data['environment'] === 'test') {
      return of<any>({
        validationURL: "https://apple-pay-gateway.apple.com/paymentservices/startSession",
        displayName: "My Online Store",
        merchantIdentifier: "merchant.com.myonlinestore",
        initiative: "web",
        initiativeContext: "myonlinestore.com",
      })
    }

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
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (env === 'test') {
      return of<NewCardTransactionRequest>({
        transaction: {
          trx_token: "trx_1234567890abcdef",
          language: "en",
          ch_full_name: "John Doe",
          ch_address: "123 Main Street",
          ch_city: "New York",
          ch_zip: "10001",
          ch_country: "US",
          ch_phone: "+1-555-123-4567",
          ch_email: "john.doe@example.com",
          meta: {
            orderId: "order_98765",
            campaign: "spring_sale_2025",
          },
          payment_method_type: "card",
          payment_method_data: {
            card_number: "4111111111111111",
            expiration_month: "12",
            expiration_year: "2026",
            cvv: "123",
            card_holder_name: "John Doe"
          }
        }
      })
    }

    return this.httpClient.post<any>(
      `https://ipgtest.monri.com/v2/transaction`,
      JSON.stringify(req),
      {headers}
    );
  }
}

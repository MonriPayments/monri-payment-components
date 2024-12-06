import { inject, Injectable } from '@angular/core';
import {
  AlternativePaymentMethodInterface,
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';
import { WebPayService } from './web-pay.service';
import { delay, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeksPayService implements AlternativePaymentMethodInterface {
  private readonly _webPayService: WebPayService = inject(WebPayService);

  public startPayment(
    params: StartPaymentRequest
  ): Observable<StartPaymentResponse> {
    if (params.is_test) {
      return of({
        acquirer: '',
        input_timeout: 0,
        product: '',
        qr_text: {
          amount: '',
          bill_id: 0,
          cid: '',
          currency: '',
          qr_type: '',
          tid: ''
        },
        status: 'test'
      });
    }

    return this.webPayService.startPayment({
      payment_method: params.payment_method,
      data: params.data
    });
  }

  get webPayService(): WebPayService {
    return this._webPayService;
  }
}

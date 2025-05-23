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
    return this.webPayService.startPayment({
      payment_method: params.payment_method,
      data: params.data
    });
  }

  get webPayService(): WebPayService {
    return this._webPayService;
  }
}

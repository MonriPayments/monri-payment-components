import { Injectable } from '@angular/core';
import {
  AlternativePaymentMethodInterface,
  StartPaymentMethodParams,
  StartPaymentMethodResponse
} from './alternative-payment-method.interface';

@Injectable({
  providedIn: 'root'
})
export class KeksPayService implements AlternativePaymentMethodInterface {
  constructor() {}

  public startPayment(
    params: StartPaymentMethodParams
  ): Promise<StartPaymentMethodResponse> | null {
    console.log(params, 'params');
    return null;
  }
}

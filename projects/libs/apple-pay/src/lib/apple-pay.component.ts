import { Component, inject, Input } from '@angular/core';
import { patchState } from '@ngrx/signals';
import { ApplePayStore } from './store/apple-pay.store';
import { StartPaymentRequest } from './interfaces/alternative-payment-method.interface';
import { ApplePayService } from './services/apple-pay.service';

@Component({
  selector: 'lib-apple-pay',
  templateUrl: './apple-pay.component.html',
  standalone: true,
  styleUrls: ['./apple-pay.component.scss'],
  providers: [ApplePayStore, ApplePayService]
})
export class ApplePayComponent {
  protected readonly applePayStore = inject(ApplePayStore);

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.applePayStore, { inputParams: value });
    console.log('inputParams:', this.applePayStore.inputParams());
  }
}

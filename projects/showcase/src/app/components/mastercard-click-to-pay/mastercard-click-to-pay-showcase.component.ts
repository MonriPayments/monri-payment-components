import { Component, inject, Injector, OnDestroy, OnInit } from '@angular/core';
import { MastercardClickToPayComponent } from '../../../../../libs/mastercard-click-to-pay/src/lib/mastercard-click-to-pay.component';
import { createCustomElement } from '@angular/elements';
import { StartPaymentRequest } from '../../../../../libs/mastercard-click-to-pay/src/lib/interfaces/alternative-payment-method.interface';

interface MastercardClickToPayElement extends HTMLElement {
  inputParams: StartPaymentRequest;
}

@Component({
  selector: 'app-mastercard-click-to-pay',
  standalone: true,
  imports: [MastercardClickToPayComponent],
  template: ` <div
    style="width: 18rem; height: 7rem; padding: 0.5rem"
    id="mastercard-click-to-pay-component"
  ></div>`
})
export class MastercardClickToPayShowcaseComponent
  implements OnInit, OnDestroy
{
  readonly #injector = inject(Injector);
  private mastercardClickToPayElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(
      MastercardClickToPayComponent,
      {
        injector: this.#injector
      }
    );
    if (!customElements.get('lib-mastercard-click-to-pay')) {
      customElements.define(
        'lib-mastercard-click-to-pay',
        customElementConstructor
      );
    }

    const mastercardClickToPayElement = document.createElement(
      'lib-mastercard-click-to-pay'
    ) as MastercardClickToPayElement;
    mastercardClickToPayElement.inputParams = {
      data: {
        locale: 'en_US',
        srcDpaId: '0650bdfd-ec8b-4d67-b976-ea7d19637c00_dpa0'
      },
      payment_method: 'mastercard-click-to-pay',
      is_test: true
    };

    const mastercardClickToPayComponent = document.getElementById(
      'mastercard-click-to-pay-component'
    );
    mastercardClickToPayComponent!.appendChild(mastercardClickToPayElement);
  }

  ngOnDestroy() {
    if (this.mastercardClickToPayElement) {
      this.mastercardClickToPayElement.remove();
    }
  }
}

import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {MastercardClickToPayComponent} from '../../../../../libs/mc-click-to-pay/src/lib/mc-click-to-pay.component';
import {createCustomElement} from '@angular/elements';
import {StartPaymentRequest} from "../../../../../libs/mc-click-to-pay/src/lib/interfaces/alternative-payment-method.interface";

interface MastercardClickToPayElement extends HTMLElement {
  inputParams: StartPaymentRequest;
}

@Component({
  selector: 'app-mc-click-to-pay',
  standalone: true,
  imports: [MastercardClickToPayComponent],
  template: `
    <div style="width: 18rem; height: 7rem; padding: 0.5rem" id="mc-click-to-pay-component"></div>`
})
export class MastercardClickToPayShowcaseComponent implements OnInit, OnDestroy {
  readonly #injector = inject(Injector);
  private mastercardClickToPayElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(MastercardClickToPayComponent, {
      injector: this.#injector
    });
    if (!customElements.get('lib-mc-click-to-pay')) {
      customElements.define('lib-mc-click-to-pay', customElementConstructor);
    }

    const mastercardClickToPayElement = document.createElement(
      'lib-mc-click-to-pay'
    ) as MastercardClickToPayElement;
    mastercardClickToPayElement.inputParams = {
      data: {
        lang: 'en'
      },
      payment_method: 'mc-click-to-pay',
      is_test: true
    }

    const mastercardClickToPayComponent = document.getElementById('mc-click-to-pay-component');
    mastercardClickToPayComponent!.appendChild(mastercardClickToPayElement);
  }

  ngOnDestroy() {
    if (this.mastercardClickToPayElement) {
      this.mastercardClickToPayElement.remove();
    }
  }
}

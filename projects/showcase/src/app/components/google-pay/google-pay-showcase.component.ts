import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {createCustomElement} from '@angular/elements';
import {GooglePayComponent} from '../../../../../libs/google-pay/src/lib/google-pay.component';
import {
  StartPaymentRequest
} from "../../../../../libs/google-pay/src/lib/interfaces/alternative-payment-method.interface";

interface GooglePayElement extends HTMLElement {
  inputParams: StartPaymentRequest;
}

@Component({
  selector: 'app-google-pay',
  standalone: true,
  imports: [],
  template: `
    <div id="google-pay-component"></div>`
})
export class GooglePayShowcaseComponent implements OnInit, OnDestroy {
  readonly #injector = inject(Injector);
  private googlePayElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(GooglePayComponent, {
      injector: this.#injector
    });
    if (!customElements.get('lib-google-pay')) {
      customElements.define('lib-google-pay', customElementConstructor);
    }

    const googlePayElement = document.createElement('lib-google-pay') as GooglePayElement;
    googlePayElement.inputParams = {
      payment_method: 'google-pay',
      data: {buttonStyle: "black", buttonType: "buy", buttonLocale: "de"},
    }

    const googlePayComponent = document.getElementById('google-pay-component');
    googlePayComponent!.appendChild(googlePayElement);
  }

  ngOnDestroy() {
    if (this.googlePayElement) {
      this.googlePayElement.remove();
    }
  }
}

import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {createCustomElement} from "@angular/elements";
import {ApplePayComponent} from "../../../../../libs/apple-pay/src/lib/apple-pay.component";
import {
  StartPaymentRequest
} from "../../../../../libs/keks-pay/src/lib/interfaces/alternative-payment-method.interface";

interface ApplePayElement extends HTMLElement {
  inputParams: StartPaymentRequest;
}

@Component({
  selector: 'app-apple-pay',
  standalone: true,
  imports: [],
  template: `
    <div id="apple-pay-component"></div>`
})

export class ApplePayShowcaseComponent implements OnInit, OnDestroy {
  readonly #injector = inject(Injector);
  private applePayElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(ApplePayComponent, {
      injector: this.#injector
    });
    if (!customElements.get('lib-apple-pay')) {
      customElements.define('lib-apple-pay', customElementConstructor);
    }

    const applePayElement = document.createElement('lib-apple-pay') as ApplePayElement;
    applePayElement.inputParams = {
      payment_method: 'apple-pay',
      data: {buttonStyle: "black", buttonType: "donate", locale: "en"},
      is_test: false,

    }
    const applePayComponent = document.getElementById('apple-pay-component');

    applePayComponent!.appendChild(applePayElement);
  }

  ngOnDestroy() {
    if (this.applePayElement) {
      this.applePayElement.remove();
    }
  }
}

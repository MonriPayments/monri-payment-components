import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {createCustomElement} from "@angular/elements";
import {ApplePayComponent} from "../../../../../libs/apple-pay/src/lib/apple-pay.component";
import {ApplePayButtonConfig} from "../../../../../libs/apple-pay/src/models/apple-pay.models";

interface ApplePayElement extends HTMLElement {
  inputParams: ApplePayButtonConfig;
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
      countryCode: 'HR',
      currencyCode: 'EUR',
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      merchantCapabilities: ['supports3DS'],
      totalLabel: 'Parkmatix',
      totalAmount: '5.00'
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

import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {KeksPayComponent} from '../../../../../libs/keks-pay/src/lib/keks-pay.component';
import {createCustomElement} from '@angular/elements';
import {StartPaymentRequest} from "../../../../../libs/keks-pay/src/lib/services/alternative-payment-method.interface";

interface KeksPayElement extends HTMLElement {
  inputParams: StartPaymentRequest;
}

@Component({
  selector: 'app-keks-pay',
  standalone: true,
  imports: [KeksPayComponent],
  template: `
    <div id="keks-pay-component"></div>`
})
export class KeksPayShowcaseComponent implements OnInit, OnDestroy {
  readonly #injector = inject(Injector);
  private keksPayElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(KeksPayComponent, {
      injector: this.#injector
    });
    if (!customElements.get('lib-keks-pay')) {
      customElements.define('lib-keks-pay', customElementConstructor);
    }

    const keksPayElement = document.createElement(
      'lib-keks-pay'
    ) as KeksPayElement;
    keksPayElement.inputParams = {
      payment_method: 'keks-pay',
      data: {
        lang: 'en'
      }
    }

    const keksPayComponent = document.getElementById('keks-pay-component');
    keksPayComponent!.appendChild(keksPayElement);
  }

  ngOnDestroy() {
    if (this.keksPayElement) {
      this.keksPayElement.remove();
    }
  }
}

import { Component, inject, Injector, OnInit } from '@angular/core';
import { KeksPayComponent } from '../../../../../libs/keks-pay/src/lib/keks-pay.component';
import { createCustomElement } from '@angular/elements';

interface KeksPayElement extends HTMLElement {
  billid: string;
  cid: string;
  tid: string;
  store: string;
  amount: number;
}

@Component({
  selector: 'app-keks-pay',
  standalone: true,
  imports: [KeksPayComponent],
  template: `<div id="keks-pay-component"></div>`
})
export class KeksPayShowcaseComponent implements OnInit {
  readonly #injector = inject(Injector);

  ngOnInit() {
    const customElementConstructor = createCustomElement(KeksPayComponent, {
      injector: this.#injector
    });
    customElements.define('lib-keks-pay', customElementConstructor);

    const keksPayElement = document.createElement(
      'lib-keks-pay'
    ) as KeksPayElement;
    keksPayElement.billid = 'HGHGHG121222';
    keksPayElement.cid = 'C00455';
    keksPayElement.tid = 'P0011033';
    keksPayElement.amount = 123.45;
    keksPayElement.store = 'MERCHANT';
    keksPayElement.addEventListener('onComponentLoad', (event: any) => {
      console.log('event:', event.detail);
    });

    const keksPayComponent = document.getElementById('keks-pay-component');
    keksPayComponent!.appendChild(keksPayElement);
  }
}

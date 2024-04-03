import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {KeksPayComponent} from '../../../../../libs/keks-pay/src/lib/keks-pay.component';
import {createCustomElement} from "@angular/elements";

interface KeksPayElement extends HTMLElement {
  billid: string;
  keksid: string;
  tid: string;
  store: string;
  amount: number;
  status: number;
  message: string;
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
    const customElementConstructor = createCustomElement(KeksPayComponent, {injector: this.#injector});
    if (!customElements.get('lib-keks-pay')) {
      customElements.define('lib-keks-pay', customElementConstructor);
    }

    const keksPayElement = document.createElement('lib-keks-pay') as KeksPayElement;
    keksPayElement.billid = 'billid'
    keksPayElement.keksid = 'keksid'
    keksPayElement.addEventListener('onComponentLoad', (event: any) => {
      console.log('event:', event.detail);
    });

    const keksPayComponent = document.getElementById('keks-pay-component');
    keksPayComponent!.appendChild(keksPayElement);
  }

  ngOnDestroy() {
    if (this.keksPayElement) {
      this.keksPayElement.remove();
    }
  }
}

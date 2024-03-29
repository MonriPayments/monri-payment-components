import {Component, Injector, OnInit} from '@angular/core';
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
  template: `<div id="keks-pay-component"></div>`
})
export class KeksPayShowcaseComponent implements OnInit {
  constructor(private injector: Injector) {
  }

  ngOnInit() {
    const customElementConstructor = createCustomElement(KeksPayComponent, {injector: this.injector});
    customElements.define('lib-keks-pay', customElementConstructor);

    const keksPayElement = document.createElement('lib-keks-pay') as KeksPayElement;
    keksPayElement.billid = 'billid'
    keksPayElement.keksid = 'keksid'
    keksPayElement.addEventListener('onComponentLoad', (event: any) => {
      console.log('event:', event.detail);
    });

    const keksPayComponent = document.getElementById('keks-pay-component');
    keksPayComponent!.appendChild(keksPayElement);
  }
}

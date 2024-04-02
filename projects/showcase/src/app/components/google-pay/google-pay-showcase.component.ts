import {Component, inject, Injector, OnInit} from '@angular/core';
import {createCustomElement} from "@angular/elements";
import {GooglePayComponent} from "../../../../../libs/google-pay/src/lib/google-pay.component";


@Component({
  selector: 'app-google-pay',
  standalone: true,
  imports: [GooglePayComponent],
  template: `
      <div id="google-pay-component"></div>`
})
export class GooglePayShowcaseComponent implements OnInit {
  readonly #injector = inject(Injector);

  ngOnInit() {
    const customElementConstructor = createCustomElement(GooglePayComponent, {injector: this.#injector});
    customElements.define('lib-google-pay', customElementConstructor);

    const googlePayElement = document.createElement('lib-google-pay') as any;


    const googlePayComponent = document.getElementById('google-pay-component');
    googlePayComponent!.appendChild(googlePayElement);
  }
}

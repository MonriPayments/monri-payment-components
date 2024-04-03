import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {createCustomElement} from "@angular/elements";
import {GooglePayComponent} from "../../../../../libs/google-pay/src/lib/google-pay.component";


@Component({
  selector: 'app-google-pay',
  standalone: true,
  imports: [GooglePayComponent],
  template: `
      <div id="google-pay-component"></div>`
})
export class GooglePayShowcaseComponent implements OnInit, OnDestroy {
  readonly #injector = inject(Injector);
  private googlePayElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(GooglePayComponent, {injector: this.#injector});
    if (!customElements.get('lib-google-pay')) {
      customElements.define('lib-google-pay', customElementConstructor);
    }

    const googlePayElement = document.createElement('lib-google-pay') as any;


    const googlePayComponent = document.getElementById('google-pay-component');
    googlePayComponent!.appendChild(googlePayElement);
  }

  ngOnDestroy() {
    if (this.googlePayElement) {
      this.googlePayElement.remove();
    }
  }
}

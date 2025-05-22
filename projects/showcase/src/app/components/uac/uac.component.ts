import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {createCustomElement} from '@angular/elements';
import {UacComponent} from "../../../../../libs/uac/src/lib/uac.component";

interface UacElement extends HTMLElement {
}

@Component({
  selector: 'app-uac-pay',
  standalone: true,
  imports: [UacComponent],
  template: `
    <div style="width: 18rem; height: 7rem; padding: 0.5rem" id="uac-component"></div>`
})
export class UacShowcaseComponent implements OnInit, OnDestroy {
  readonly #injector = inject(Injector);
  private uacElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(UacComponent, {
      injector: this.#injector
    });
    if (!customElements.get('lib-uac')) {
      customElements.define('lib-uac', customElementConstructor);
    }

    const uacElement = document.createElement(
      'lib-uac'
    ) as UacElement;

    const uacComponent = document.getElementById('uac-component');
    uacComponent!.appendChild(uacElement);
  }

  ngOnDestroy() {
    if (this.uacElement) {
      this.uacElement.remove();
    }
  }
}

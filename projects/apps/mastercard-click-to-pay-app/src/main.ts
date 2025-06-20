import { createApplication } from '@angular/platform-browser';
import { appConfig } from './main.config';
import { createCustomElement } from '@angular/elements';
import { MastercardClickToPayComponent } from 'mastercard-click-to-pay';
import { ApplicationRef } from '@angular/core';

(async () => {
  const app: ApplicationRef = await createApplication(appConfig);
  const mastercardClickToPayComponent = createCustomElement(MastercardClickToPayComponent, {
    injector: app.injector
  });
  customElements.define('lib-mastercard-click-to-pay', mastercardClickToPayComponent);
})();

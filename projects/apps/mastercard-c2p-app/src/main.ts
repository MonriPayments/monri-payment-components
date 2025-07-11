import { createApplication } from '@angular/platform-browser';
import { appConfig } from './main.config';
import { createCustomElement } from '@angular/elements';
import { MastercardC2pComponent } from 'mastercard-c2p';
import { ApplicationRef } from '@angular/core';

(async () => {
  const app: ApplicationRef = await createApplication(appConfig);
  const mastercardC2pComponent = createCustomElement(MastercardC2pComponent, {
    injector: app.injector
  });
  customElements.define('lib-mastercard-c2p', mastercardC2pComponent);
})();

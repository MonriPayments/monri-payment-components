import { createApplication } from '@angular/platform-browser';
import { appConfig } from './main.config';
import { createCustomElement } from '@angular/elements';
import { KeksPayComponent } from 'keks-pay';
import { ApplicationRef } from '@angular/core';

(async () => {
  const app: ApplicationRef = await createApplication(appConfig);
  const keksPayComponent = createCustomElement(KeksPayComponent, {
    injector: app.injector
  });
  customElements.define('lib-keks-pay', keksPayComponent);
})();

import { createApplication } from '@angular/platform-browser';
import { appConfig } from './main.config';
import { createCustomElement } from '@angular/elements';
import { GooglePayComponent } from 'google-pay';
import { ApplicationRef } from '@angular/core';

(async () => {
  const app: ApplicationRef = await createApplication(appConfig);
  const googlePayComponent = createCustomElement(GooglePayComponent, {
    injector: app.injector
  });
  customElements.define('lib-google-pay', googlePayComponent);
})();

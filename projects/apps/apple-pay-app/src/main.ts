import {createApplication} from '@angular/platform-browser';
import {createCustomElement} from '@angular/elements';
import {ApplicationRef} from '@angular/core';
import {appConfig} from './main.config';
import {ApplePayComponent} from 'apple-pay';

(async () => {
  const app: ApplicationRef = await createApplication(appConfig);
  const applePayComponent = createCustomElement(ApplePayComponent, {
    injector: app.injector
  });
  customElements.define('lib-apple-pay', applePayComponent);
})();

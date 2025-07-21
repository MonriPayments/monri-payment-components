import {createApplication} from '@angular/platform-browser';
import {ApplicationRef} from "@angular/core";
import {createCustomElement} from "@angular/elements";
import {appConfig} from "./main.config";
import {UacComponent} from "uac";

(async () => {
  const app: ApplicationRef = await createApplication(appConfig);
  const uacWebComponent = createCustomElement(UacComponent, {
    injector: app.injector
  });
  customElements.define('lib-uac', uacWebComponent);
})();

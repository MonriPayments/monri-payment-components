import {Component, inject} from '@angular/core';
import {GooglePayService} from "./services/google-pay.service";
import {GooglePayStore} from "./store/google-pay.store";

@Component({
  selector: 'lib-google-pay',
  template: `
    <div class="container">
      <div id="container-google">
        <p id="message"></p>
      </div>
    </div>
  `,
  standalone: true,
  providers: [GooglePayStore, GooglePayService]
})
export class GooglePayComponent {
  protected readonly googlePayStore = inject(GooglePayStore);
}

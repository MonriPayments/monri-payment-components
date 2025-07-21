import {Component, inject} from '@angular/core';
import {ApplePayStore} from './store/apple-pay.store';
import {ApplePayService} from './services/apple-pay.service';

@Component({
  selector: 'lib-apple-pay',
  template: `
    <div class="container">
      <div id="container-apple">
        <p id="message"></p>
      </div>
    </div>
  `,
  standalone: true,
  providers: [ApplePayStore, ApplePayService]
})
export class ApplePayComponent {
  protected readonly applePayStore = inject(ApplePayStore);
}

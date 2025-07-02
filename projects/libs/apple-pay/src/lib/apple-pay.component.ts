import {Component, inject} from '@angular/core';
import {ApplePayStore} from './store/apple-pay.store';
import {ApplePayService} from './services/apple-pay.service';

@Component({
  selector: 'lib-apple-pay',
  templateUrl: './apple-pay.component.html',
  standalone: true,
  styleUrls: ['./apple-pay.component.scss'],
  providers: [ApplePayStore, ApplePayService]
})
export class ApplePayComponent {
  protected readonly applePayStore = inject(ApplePayStore);
}

import {Component, inject} from '@angular/core';
import {GooglePayService} from "./services/google-pay.service";
import {GooglePayStore} from "./store/google-pay.store";

@Component({
  selector: 'lib-google-pay',
  templateUrl: './google-pay.component.html',
  standalone: true,
  styleUrls: ['./google-pay.component.scss'],
  providers: [GooglePayStore, GooglePayService]
})
export class GooglePayComponent {
  protected readonly googlePayStore = inject(GooglePayStore);
}

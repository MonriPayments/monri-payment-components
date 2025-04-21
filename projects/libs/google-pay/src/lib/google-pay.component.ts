import {Component, inject, Input, OnInit} from '@angular/core';
import {patchState} from "@ngrx/signals";
import {GooglePayService} from "./services/google-pay.service";
import {GooglePayStore} from "./store/google-pay.store";
import {StartPaymentRequest} from "./interfaces/alternative-payment-method.interface";
import {setFulfilled} from "./store/request-status.feature";
import {take} from "rxjs";

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

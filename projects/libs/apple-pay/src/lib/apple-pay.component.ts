import {Component, effect, ElementRef, inject, Input, OnInit, Renderer2} from '@angular/core';
import {ApplePayButtonConfig} from "./models/apple-pay.models";
import {patchState} from "@ngrx/signals";
import {ApplePayStore} from "./store/apple-pay.store";
import {StartPaymentRequest} from "./interfaces/alternative-payment-method.interface";
import {ApplePayService} from "./services/apple-pay.service";

@Component({
  selector: 'lib-apple-pay',
  templateUrl: './apple-pay.component.html',
  standalone: true,
  styleUrls: ['./apple-pay.component.scss'],
  providers: [ApplePayStore, ApplePayService],
})
export class ApplePayComponent implements OnInit {

  appleInputParams: ApplePayButtonConfig | undefined = undefined;

  protected readonly applePayStore = inject(ApplePayStore)

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.applePayStore, {inputParams: value});
    console.log("Proba", this.applePayStore.inputParams());
  }

  constructor(private renderer: Renderer2, private el: ElementRef) {
    effect(() => {
      console.log("Proba", this.applePayStore.inputParams());
    });
  }

  ngOnInit(): void {
    this.loadApplePayScript().then(() => this.createApplePayButton());
  }

  private loadApplePayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Script is loaded.")
      const script = this.renderer.createElement('script');
      script.src =
        'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      this.renderer.appendChild(document.body, script);
    });
  }

  private createApplePayButton(): void {
    const applePayButton = this.renderer.createElement('apple-pay-button');
    this.renderer.setAttribute(applePayButton, 'id', 'apple-pay-button');
    this.renderer.setAttribute(applePayButton, 'buttonstyle', this.applePayStore.appleButtonStyle().buttonStyle || 'black');
    this.renderer.setAttribute(applePayButton, 'type', this.applePayStore.appleButtonStyle().buttonType || 'buy');
    this.renderer.setAttribute(applePayButton, 'locale', this.applePayStore.appleButtonStyle().locale || 'en-US');

    this.renderer.appendChild(
      this.el.nativeElement.querySelector('#container'),
      applePayButton
    );
    console.log("Button is created.")
    this.renderer.listen(
      applePayButton,
      'click',
      this.onApplePayButtonClick.bind(this)
    );
  }

  private onApplePayButtonClick(): void {
    console.log('Button clicked');
    const request = {
      countryCode: this.appleInputParams?.countryCode || 'HR',
      currencyCode: this.appleInputParams?.currencyCode || 'EUR',
      supportedNetworks: this.appleInputParams?.supportedNetworks || ['visa', 'masterCard', 'amex', 'discover'],
      merchantCapabilities: this.appleInputParams?.merchantCapabilities || ['supports3DS'],
      total: {
        label: this.appleInputParams?.totalLabel || "Parkmatix",
        amount: this.appleInputParams?.totalAmount || "2.00",
      }
    };
    console.log("Request:", request)

    const session = new (window as any).ApplePaySession(3, request);
    session.onvalidatemerchant = (event: { validationURL: any }) => {
      const applePayInstance = {
        performValidation: (
          options: any,
          callback: (
            arg0: null,
            arg1: {
              merchantSession: string;
            }
          ) => void
        ) => {
          // Mock implementation of performValidation
          callback(null, {merchantSession: 'validSessionData'});
        }
      };

      applePayInstance.performValidation(
        {
          validationURL: event.validationURL,
          displayName: 'My Store'
        },
        (err, merchantSession) => {
          if (err) {
            console.error('Apple Pay failed to load.');
            return;
          }
          session.completeMerchantValidation(merchantSession);
        }
      );
    };

    session.begin();
  }
}

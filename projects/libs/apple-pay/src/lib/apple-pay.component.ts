import {Component, ElementRef, Input, OnInit, Renderer2} from '@angular/core';
import {ApplePayButtonConfig} from "./models/apple-pay.models";

@Component({
  selector: 'lib-apple-pay',
  templateUrl: './apple-pay.component.html',
  standalone: true,
  styleUrls: ['./apple-pay.component.scss']
})
export class ApplePayComponent implements OnInit {

  appleInputParams: ApplePayButtonConfig | undefined = undefined;

  @Input() set inputParams(value: ApplePayButtonConfig) {
    console.log(value, "Value:")
    this.appleInputParams = value
  }

  constructor(private renderer: Renderer2, private el: ElementRef) {
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
    this.renderer.setAttribute(applePayButton, 'buttonstyle', this.appleInputParams?.buttonStyle || 'black');
    this.renderer.setAttribute(applePayButton, 'type', this.appleInputParams?.buttonType || 'buy');
    this.renderer.setAttribute(applePayButton, 'locale', this.appleInputParams?.locale || 'en-US');

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

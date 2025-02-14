import {Component, inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {createCustomElement} from '@angular/elements';
import {GooglePayComponent} from '../../../../../libs/google-pay/src/lib/google-pay.component';
import {
  GoogleErrorState,
  GoogleIsReadyToPayRequest,
  GooglePaymentDataRequest,
  GoogleTransactionInfo
} from "../../../../../libs/google-pay/src/models/google-pay.models";

interface GooglePayElement extends HTMLElement {
  googleTransactionInfo: GoogleTransactionInfo
  googlePaymentDataRequest: GooglePaymentDataRequest
  googleIsReadyToPayRequest: GoogleIsReadyToPayRequest
  googleErrorState?: GoogleErrorState
  googleTransactionState: { onSuccess: string, onError: string }
  googleEnvironment: string
}

@Component({
  selector: 'app-google-pay',
  standalone: true,
  imports: [GooglePayComponent],
  template: `
    <div id="google-pay-component"></div>`
})
export class GooglePayShowcaseComponent implements OnInit, OnDestroy {
  readonly #injector = inject(Injector);
  private googlePayElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(GooglePayComponent, {
      injector: this.#injector
    });
    if (!customElements.get('lib-google-pay')) {
      customElements.define('lib-google-pay', customElementConstructor);
    }

    const googlePayElement = document.createElement('lib-google-pay') as GooglePayElement;
    this.getGoogleInputParameters(googlePayElement);

    const googlePayComponent = document.getElementById('google-pay-component');
    googlePayComponent!.appendChild(googlePayElement);
  }

  ngOnDestroy() {
    if (this.googlePayElement) {
      this.googlePayElement.remove();
    }
  }

  private getGoogleInputParameters(googlePayElement: GooglePayElement) {
    const googleTransactionInfo = {
      displayItems: [
        {
          label: 'Subtotal',
          type: 'SUBTOTAL',
          price: '2.00'
        },
        {
          label: 'Tax',
          type: 'TAX',
          price: '1.00'
        }
      ],
      countryCode: 'US',
      currencyCode: 'USD',
      totalPriceStatus: 'FINAL',
      totalPrice: '3.00',
      totalPriceLabel: 'Total'
    };
    googlePayElement.googleTransactionInfo = googleTransactionInfo;

    googlePayElement.googlePaymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: [
              'AMEX',
              'DISCOVER',
              'INTERAC',
              'JCB',
              'MASTERCARD',
              'VISA'
            ]
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'example',
              gatewayMerchantId: 'exampleGatewayMerchantId'
            }
          }
        }
      ],
      transactionInfo: googleTransactionInfo,
      merchantInfo: {
        merchantId: 'BCR2DN4TQHE6DYLO',
        merchantName: 'Harun'
      },
      // callbackIntents: ['PAYMENT_AUTHORIZATION']
    };

    const baseCardPaymentMethod = {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['MASTERCARD', 'VISA']
      }
    };
    googlePayElement.googleIsReadyToPayRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [baseCardPaymentMethod]
    };
    googlePayElement.googleErrorState = {
      // intent: 'PAYMENT_AUTHORIZATION',
      message:
        'Insufficient funds, try again. Next attempt should work.',
      reason: 'PAYMENT_DATA_INVALID'
    }
    googlePayElement.googleTransactionState = {
      onSuccess: 'SUCCESS',
      onError: 'ERROR'
    }
    googlePayElement.googleEnvironment = 'TEST'
  }

}

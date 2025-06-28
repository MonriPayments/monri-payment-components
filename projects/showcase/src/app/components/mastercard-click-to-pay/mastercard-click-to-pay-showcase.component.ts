import { Component, inject, Injector, OnDestroy, OnInit } from '@angular/core';
import { MastercardClickToPayComponent } from '../../../../../libs/mastercard-click-to-pay/src/lib/mastercard-click-to-pay.component';
import { createCustomElement } from '@angular/elements';
import { StartPaymentRequest } from '../../../../../libs/mastercard-click-to-pay/src/lib/interfaces/alternative-payment-method.interface';
import { environment } from './environments/environment';

interface MastercardClickToPayElement extends HTMLElement {
  inputParams: StartPaymentRequest;
}

@Component({
  selector: 'app-mastercard-click-to-pay',
  standalone: true,
  imports: [MastercardClickToPayComponent],
  template: `
    <div
      style="display: flex; gap: 1rem; padding: 1rem; flex-direction: column;"
    >
      <div
        style="width: 500px; height: 400px;"
        id="mastercard-click-to-pay-component"
      ></div>

      <div style="border: 1px solid #ddd; padding: 1rem; background: #f9f9f9;">
        <h3>Test card input</h3>

        <div style="margin-bottom: 1rem;">
          <label>Card Number:</label>
          <input
            type="text"
            id="cardNumber"
            value="5186001700009726"
            style="width: 100%; margin-top: 0.5rem;"
          />
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label>Expiry Month:</label>
            <input
              type="text"
              id="expiryMonth"
              value="12"
              style="width: 100%;"
            />
          </div>
          <div>
            <label>Expiry Year:</label>
            <input
              type="text"
              id="expiryYear"
              value="27"
              style="width: 100%;"
            />
          </div>
          <div>
            <label>CVV:</label>
            <input type="text" id="cvv" value="750" style="width: 100%;" />
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <button (click)="setCardDataViaMessage()" style="padding: 0.5rem;">
            Send via Window Message
          </button>
          <button (click)="setCardDataViaAPI()" style="padding: 0.5rem;">
            Send via Direct Method
          </button>
          <button (click)="clearCardData()" style="padding: 0.5rem;">
            Clear Card Data
          </button>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <button (click)="triggerEncrypt()" style="padding: 0.5rem;">
            Trigger Encrypt
          </button>
          <button (click)="triggerCheckout()" style="padding: 0.5rem;">
            Checkout with New Card
          </button>
        </div>

        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ccc;">
          <h4>Existing Card Flow:</h4>
          <button (click)="triggerCheckoutWithCard()" style="padding: 0.5rem; background: #007bff; color: white;">
            Pay with Selected Card
          </button>
          <p style="font-size: 0.9em; color: #666; margin-top: 0.5rem;">
            First select a card from the component above, then click this button to proceed with payment.
          </p>
        </div>

        <div style="margin-top: 1rem;">
          <h4>Component State:</h4>
          <button (click)="logComponentState()" style="padding: 0.5rem;">
            Log Component State
          </button>
        </div>
      </div>
    </div>
  `
})
export class MastercardClickToPayShowcaseComponent
  implements OnInit, OnDestroy
{
  readonly #injector = inject(Injector);
  private mastercardClickToPayElement: HTMLElement | null = null;

  ngOnInit() {
    const customElementConstructor = createCustomElement(
      MastercardClickToPayComponent,
      {
        injector: this.#injector
      }
    );
    if (!customElements.get('lib-mastercard-click-to-pay')) {
      customElements.define(
        'lib-mastercard-click-to-pay',
        customElementConstructor
      );
    }

    const mastercardClickToPayElement = document.createElement(
      'lib-mastercard-click-to-pay'
    ) as MastercardClickToPayElement;
    mastercardClickToPayElement.inputParams = {
      data: {
        locale: 'en_US',
        darkTheme: false,
        production: environment.production || '',
        consumer: environment.consumer || undefined
        // NOTE: No encryptCardParams
      },
      payment_method: 'mastercard-click-to-pay',
      is_test: true
    };

    const mastercardClickToPayComponent = document.getElementById(
      'mastercard-click-to-pay-component'
    );
    mastercardClickToPayComponent!.appendChild(mastercardClickToPayElement);
  }

  ngOnDestroy() {
    if (this.mastercardClickToPayElement) {
      this.mastercardClickToPayElement.remove();
    }
  }

  private getCardDataFromForm() {
    const cardNumber = (
      document.getElementById('cardNumber') as HTMLInputElement
    ).value;
    const expiryMonth = (
      document.getElementById('expiryMonth') as HTMLInputElement
    ).value;
    const expiryYear = (
      document.getElementById('expiryYear') as HTMLInputElement
    ).value;
    const cvv = (document.getElementById('cvv') as HTMLInputElement).value;

    return {
      primaryAccountNumber: cardNumber,
      panExpirationMonth: expiryMonth,
      panExpirationYear: expiryYear,
      cardSecurityCode: cvv,
      cardholderFirstName: 'Test',
      cardholderLastName: 'User'
    };
  }

  setCardDataViaMessage() {
    const cardData = this.getCardDataFromForm();

    window.postMessage(
      {
        type: 'SET_CARD_DATA',
        cardData
      },
      '*'
    );

    console.log('Card data sent via window message:', cardData);
  }

  setCardDataViaAPI() {
    const cardData = this.getCardDataFromForm();

    const component = (window as any).mastercardClickToPayComponent;
    if (component) {
      component.setCardData(cardData);
      console.log('Card data set via API:', cardData);
    } else {
      console.error('Component API not available');
    }
  }

  clearCardData() {
    window.postMessage(
      {
        type: 'CLEAR_CARD_DATA'
      },
      '*'
    );

    const component = (window as any).mastercardClickToPayComponent;
    if (component) {
      component.clearCardData();
    }

    console.log('Card data cleared');
  }

  triggerEncrypt() {
    window.postMessage(
      {
        type: 'TRIGGER_ENCRYPT_CARD'
      },
      '*'
    );

    console.log('Encrypt triggered via message');
  }

  triggerCheckout() {
    window.postMessage(
      {
        type: 'TRIGGER_CHECKOUT_NEW_CARD'
      },
      '*'
    );

    console.log('Checkout with new card triggered via message');
  }

  triggerCheckoutWithCard() {
    window.postMessage(
      {
        type: 'TRIGGER_CHECKOUT_WITH_CARD'
      },
      '*'
    );

    console.log('Checkout with selected card triggered via message');
  }

  logComponentState() {
    const component = (window as any).mastercardClickToPayComponent;
    if (component) {
      const cardStore = component.getCardStore();
      const mainStore = component.getStore();

      console.group('Component State');
      console.log('Card Store:', {
        isCardDataReady: cardStore.isCardDataReady(),
        hasCardData: cardStore.hasCardData(),
        canEncrypt: cardStore.canEncrypt(),
        canCheckout: cardStore.canCheckout(),
        isCardEncrypted: cardStore.isCardEncrypted(),
        encryptedCard: cardStore.encryptedCard(),
        cardBrand: cardStore.cardBrand()
      });
      console.log('Main Store:', {
        maskedCards: mainStore.maskedCards(),
        isFulfilled: mainStore.isFulfilled()
      });
      console.groupEnd();
    } else {
      console.error('Component API not available');
    }
  }
}

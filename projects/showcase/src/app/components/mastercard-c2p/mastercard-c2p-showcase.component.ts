import { Component, inject, Injector, OnDestroy, OnInit } from '@angular/core';
import { MastercardC2pComponent, StartPaymentRequest } from '../../../../../libs/mastercard-c2p/src/public-api';
import { createCustomElement } from '@angular/elements';
import { environment } from './environments/environment';

interface MastercardC2pElement extends HTMLElement {
  inputParams: StartPaymentRequest;
}

@Component({
  selector: 'app-mastercard-c2p',
  standalone: true,
  imports: [MastercardC2pComponent],
  template: `
    <div
      style="display: flex; gap: 1rem; padding: 1rem; flex-direction: column;"
    >
      <div
        style="width: 500px; height: 400px;"
        id="mastercard-c2p-component"
      ></div>

      <div style="border: 1px solid #ddd; padding: 1rem; background: #f9f9f9;">
        <h3>Test card input</h3>

        <div style="margin-bottom: 1rem;">
          <label>Card Number:</label>
          <input
            type="text"
            id="cardNumber"
            value="5120350100064537"
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
          <button
            (click)="setCardData()"
            style="padding: 0.5rem; background: #007bff; color: white;"
          >
            Set Card Data
          </button>
          <button
            (click)="clearCardData()"
            style="padding: 0.5rem; background: #6c757d; color: white;"
          >
            Clear Card Data
          </button>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <button
            (click)="encryptCard()"
            style="padding: 0.5rem; background: #28a745; color: white;"
          >
            Encrypt Card
          </button>
          <button
            (click)="checkoutWithNewCard()"
            style="padding: 0.5rem; background: #dc3545; color: white;"
          >
            Checkout with New Card
          </button>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <button
            (click)="checkoutWithCard()"
            style="padding: 0.5rem; background: #17a2b8; color: white;"
          >
            Checkout with Selected Card
          </button>
          <button
            (click)="getComponentState()"
            style="padding: 0.5rem; background: #6f42c1; color: white;"
          >
            Get Component State
          </button>
        </div>
      </div>
    </div>
  `
})
export class MastercardC2pShowcaseComponent
  implements OnInit, OnDestroy
{
  readonly #injector = inject(Injector);
  private mastercardC2pElement: HTMLElement | null = null;
  private componentReady = false;

  ngOnInit() {
    window.addEventListener('message', event => {
      if (event.data.type === 'MASTERCARD_COMPONENT_READY') {
        this.componentReady = true;
        console.log('Component is ready');
      } else if (
        event.data.type === 'MASTERCARD_MASKED_CARDS_CHANGED' &&
        event.data.componentId === 'mastercard-c2p'
      ) {
        console.log('Masked cards count changed:', event.data.maskedCardsCount);
        // Handle the real-time card count updates here
      }
    });

    const customElementConstructor = createCustomElement(
      MastercardC2pComponent,
      {
        injector: this.#injector
      }
    );
    if (!customElements.get('lib-mastercard-c2p')) {
      customElements.define(
        'lib-mastercard-c2p',
        customElementConstructor
      );
    }

    const mastercardC2pElement = document.createElement(
      'lib-mastercard-c2p'
    ) as MastercardC2pElement;
    mastercardC2pElement.inputParams = {
      data: {
        locale: 'en_US',
        darkTheme: false,
        ...environment
        // NOTE: No encryptCardParams
      },
      trx_token: '',
      payment_method: 'mastercard-c2p',
      is_test: true
    };

    const mastercardC2pComponent = document.getElementById(
      'mastercard-c2p-component'
    );
    mastercardC2pComponent!.appendChild(mastercardC2pElement);
  }

  ngOnDestroy() {
    if (this.mastercardC2pElement) {
      this.mastercardC2pElement.remove();
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

  async setCardData() {
    try {
      console.log('Setting card data...');
      const cardData = this.getCardDataFromForm();
      const result = await this.sendMessageWithPromise('SET_CARD_DATA', {
        cardData
      });
      console.log('Card data set successfully:', result);
    } catch (error) {
      console.error('Error setting card data:', error);
    }
  }

  async clearCardData() {
    try {
      console.log('Clearing card data...');
      const result = await this.sendMessageWithPromise('CLEAR_CARD_DATA');
      console.log('Card data cleared successfully:', result);
    } catch (error) {
      console.error('Error clearing card data:', error);
    }
  }

  async encryptCard() {
    try {
      console.log('Encrypting card...');
      const result = await this.sendMessageWithPromise('TRIGGER_ENCRYPT_CARD');
      console.log('Card encrypted successfully:', result);
    } catch (error) {
      console.error('Error encrypting card:', error);
    }
  }

  async checkoutWithNewCard() {
    try {
      console.log('Starting checkout with new card...');
      const result = await this.sendMessageWithPromise(
        'TRIGGER_CHECKOUT_NEW_CARD'
      );
      console.log('Checkout started successfully:', result);
    } catch (error) {
      console.error('Error starting checkout:', error);
    }
  }

  async checkoutWithCard() {
    try {
      console.log('Starting checkout with selected card...');
      const result = await this.sendMessageWithPromise(
        'TRIGGER_CHECKOUT_WITH_CARD'
      );
      console.log('Checkout with card started successfully:', result);
    } catch (error) {
      console.error('Error starting checkout with card:', error);
    }
  }

  async getComponentState() {
    try {
      console.log('Getting component state...');
      const result = await this.sendMessageWithPromise('GET_COMPONENT_STATE');
      console.log('Component state:', result);
    } catch (error) {
      console.error('Error getting component state:', error);
    }
  }

  private sendMessageWithPromise(type: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.componentReady) {
        reject(new Error('Component not ready yet'));
        return;
      }

      const requestId = `${type}_${Date.now()}_${Math.random()}`;

      const timeout = setTimeout(() => {
        window.removeEventListener('message', responseHandler);
        reject(new Error(`Timeout waiting for response to ${type}`));
      }, 5000);

      const responseHandler = (event: MessageEvent) => {
        if (
          event.data.type === 'MASTERCARD_RESPONSE' &&
          event.data.requestId === requestId
        ) {
          clearTimeout(timeout);
          window.removeEventListener('message', responseHandler);

          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error || 'Unknown error'));
          }
        }
      };

      window.addEventListener('message', responseHandler);

      window.postMessage(
        {
          type,
          requestId,
          ...(data || {})
        },
        '*'
      );
    });
  }
}

import {
  Component,
  HostListener,
  inject,
  Input,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
  AfterViewInit,
  effect,
  Injector,
  runInInjectionContext,
  afterNextRender
} from '@angular/core';
import { MastercardClickToPayService } from './services/mastercard-click-to-pay.service';
import { take } from 'rxjs';
import { StartPaymentRequest } from './interfaces/alternative-payment-method.interface';
import { MastercardClickToPayStore } from './store/mastercard-click-to-pay.store';
import { CardDataStore } from './store/card-data.store';
import { patchState } from '@ngrx/signals';
import { setFulfilled } from './store/request-status.feature';
import { ComplianceSettings } from './interfaces/mastercard-click-to-pay.interface';

@Component({
  selector: 'lib-mastercard-click-to-pay',
  standalone: true,
  templateUrl: 'mastercard-click-to-pay.component.html',
  styleUrl: 'mastercard-click-to-pay.component.scss',
  providers: [
    MastercardClickToPayService,
    MastercardClickToPayStore,
    CardDataStore
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MastercardClickToPayComponent implements OnInit, AfterViewInit {
  private readonly injector = inject(Injector);
  readonly store = inject(MastercardClickToPayStore);
  readonly cardStore = inject(CardDataStore);
  private readonly _service = inject(MastercardClickToPayService);

  @ViewChild('cardList', { static: false }) cardListRef?: ElementRef;
  @ViewChild('consent', { static: false }) consentRef?: ElementRef;

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.store, { inputParams: value });

    const encryptCardParams = value.data['encryptCardParams'];
    if (encryptCardParams) {
      this.cardStore.setCardData(encryptCardParams);
    }

    console.log(
      'Mastercard Click To Pay inputParams:',
      this.store.inputParams()
    );
  }

  get mastercardClickToPayService(): MastercardClickToPayService {
    return this._service;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    patchState(this.store, { resolution: window.innerWidth });
  }

  ngOnInit(): void {
    this.validateInputParams();
    this.startPayment();
  }

  ngAfterViewInit(): void {
    this.setupWindowMessageHandlers();

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const cards = this.store.maskedCards();
        if (cards.length > 0) {
          this.loadCardsIntoComponent(cards);
        } else {
          this.setupConsentListener();
        }
      });

      effect(() => {
        if (this.store.isFulfilled()) {
          this.store.onLoad(
            () => this.createModal(),
            () => this.closeModal()
          );
        }
      });

      effect(() => {
        const maskedCardsCount = this.store.maskedCards().length;
        this.emitMaskedCardsChanged(maskedCardsCount);
      });
    });
  }

  private loadCardsIntoComponent(cards: unknown[]): void {
    if (!this.cardListRef) {
      afterNextRender(
        () => {
          this.loadCardsIntoComponent(cards);
        },
        { injector: this.injector }
      );
      return;
    }

    if (this.cardListRef?.nativeElement?.loadCards) {
      this.cardListRef.nativeElement.loadCards(cards);
      this.setupCardSelectionListener();
    }
  }

  private setupCardSelectionListener(): void {
    if (this.cardListRef?.nativeElement) {
      this.cardListRef.nativeElement.addEventListener(
        'selectSrcDigitalCardId',
        (event: CustomEvent) => {
          console.log('Selected card ID:', event.detail);
          this.onCardSelected(event.detail);
        }
      );

      this.cardListRef.nativeElement.addEventListener(
        'clickSignOutLink',
        (event: CustomEvent) => {
          console.log('Sign out link clicked:', event.detail);
          this.onSignOut(event.detail);
        }
      );
    }
  }

  private onCardSelected(srcDigitalCardId: string): void {
    patchState(this.store, { selectedCardId: srcDigitalCardId });
  }

  private onSignOut(detail: { recognitionToken?: string }): void {
    this.store.signOut(detail?.recognitionToken);
  }

  private setupConsentListener(): void {
    if (!this.consentRef) {
      afterNextRender(
        () => {
          this.setupConsentListener();
        },
        { injector: this.injector }
      );
      return;
    }

    if (this.consentRef?.nativeElement) {
      this.consentRef.nativeElement.addEventListener(
        'checkoutAsGuest',
        (event: CustomEvent) => {
          console.log('Checkout as guest event:', event.detail);
          this.onCheckoutAsGuest(event.detail);
        }
      );
    }
  }

  private onCheckoutAsGuest(detail: {
    checkoutAsGuest: boolean;
    complianceResources: Array<ComplianceSettings>;
  }): void {
    console.log('Checkout as guest preferences updated:', detail);
    patchState(this.store, {
      recognitionTokenRequested: detail.checkoutAsGuest
    });
  }

  private startPayment() {
    const input = this.store.inputParams();

    if (input.is_test) {
      patchState(this.store, {
        srcDpaId: '0650bdfd-ec8b-4d67-b976-ea7d19637c00_dpa0',
        dpaData: { dpaName: 'Testdpa0' },
        dpaTransactionOptions: { dpaLocale: 'en_US' },
        cardBrands: ['mastercard', 'maestro', 'visa', 'amex', 'discover']
      });
      patchState(this.store, setFulfilled());
      return;
    }

    this._service
      .startPayment(input)
      .pipe(take(1))
      .subscribe(response => {
        patchState(this.store, {
          srcDpaId: response.srcDpaId,
          dpaData: response.dpaData,
          dpaTransactionOptions: response.dpaTransactionOptions,
          cardBrands: response.cardBrands
        });
        patchState(this.store, setFulfilled());
      });
  }

  private validateInputParams() {
    const data = this.store.inputParams().data;

    if (!data['locale']) {
      throw new Error('LOCALE_NOT_SET');
    }

    if (!this.store.inputParams().is_test && !data['environment']) {
      throw new Error('ENV_NOT_SET');
    }

    if (data['environment']) {
      patchState(this.store, { environment: data['environment'] });
    }
  }

  createModal() {
    const modalWrapper = document.createElement('div');
    modalWrapper.style.position = 'fixed';
    modalWrapper.style.top = '0';
    modalWrapper.style.left = '0';
    modalWrapper.style.width = '100vw';
    modalWrapper.style.height = '100vh';
    modalWrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    modalWrapper.style.display = 'flex';
    modalWrapper.style.justifyContent = 'center';
    modalWrapper.style.alignItems = 'center';
    modalWrapper.style.zIndex = '10000';

    modalWrapper.addEventListener('click', e => {
      if (e.target === modalWrapper) {
        this.closeModal();
      }
    });

    document.body.appendChild(modalWrapper);
    (window as unknown as { currentModal?: HTMLElement }).currentModal =
      modalWrapper;

    const modal = document.createElement('div');
    modal.style.width = '480px';
    modal.style.height = '600px';
    modal.style.backgroundColor = 'white';
    modal.style.borderRadius = '1.5rem';

    modalWrapper.appendChild(modal);

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.borderRadius = '1.5rem';
    modal.appendChild(iframe);

    return iframe.contentWindow;
  }

  closeModal() {
    const windowWithModal = window as unknown as { currentModal?: HTMLElement };
    if (windowWithModal.currentModal) {
      windowWithModal.currentModal.remove();
      windowWithModal.currentModal = undefined;
    }
  }

  private emitMaskedCardsChanged(maskedCardsCount: number): void {
    window.postMessage(
      {
        type: 'MASTERCARD_MASKED_CARDS_CHANGED',
        componentId: 'mastercard-click-to-pay',
        maskedCardsCount
      },
      '*'
    );
  }

  private setupWindowMessageHandlers(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const respond = (success: boolean, data?: unknown, error?: string) => {
        if (event.data.requestId) {
          window.postMessage(
            {
              type: 'MASTERCARD_RESPONSE',
              requestId: event.data.requestId,
              success,
              data,
              error
            },
            event.origin
          );
        }
      };

      switch (event.data.type) {
        case 'SET_CARD_DATA':
          if (event.data.cardData) {
            this.cardStore.setCardData(event.data.cardData);
            console.log(
              'Card data received via window message:',
              event.data.cardData
            );
            respond(true, { cardDataSet: true });
          } else {
            respond(false, null, 'No card data provided');
          }
          break;

        case 'CLEAR_CARD_DATA':
          this.cardStore.clearCardData();
          console.log('Card data cleared via window message');
          respond(true, { cardDataCleared: true });
          break;

        case 'TRIGGER_ENCRYPT_CARD':
          if (this.cardStore.canEncrypt()) {
            this.store.encryptCard();
            respond(true, { encryptionTriggered: true });
          } else {
            console.warn('Cannot encrypt card - card data not ready');
            respond(false, null, 'Cannot encrypt card - card data not ready');
          }
          break;

        case 'TRIGGER_CHECKOUT_NEW_CARD':
          if (this.cardStore.canCheckout()) {
            this.store.checkoutWithNewCard(
              () => this.createModal(),
              () => this.closeModal()
            );
            respond(true, { checkoutTriggered: true });
          } else {
            console.warn('Cannot checkout with new card - card not encrypted');
            respond(
              false,
              null,
              'Cannot checkout with new card - card not encrypted'
            );
          }
          break;

        case 'TRIGGER_CHECKOUT_WITH_CARD':
          this.store.triggerCheckoutWithCard(
            () => this.createModal(),
            () => this.closeModal()
          );
          respond(true, { checkoutWithCardTriggered: true });
          break;

        case 'GET_COMPONENT_STATE':
          respond(true, {
            cardStore: {
              isCardDataReady: this.cardStore.isCardDataReady(),
              hasCardData: this.cardStore.hasCardData(),
              canEncrypt: this.cardStore.canEncrypt(),
              canCheckout: this.cardStore.canCheckout(),
              isCardEncrypted: this.cardStore.isCardEncrypted()
            },
            mainStore: {
              isFulfilled: this.store.isFulfilled(),
              maskedCardsCount: this.store.maskedCards().length
            }
          });
          break;
      }
    });

    window.postMessage(
      {
        type: 'MASTERCARD_COMPONENT_READY',
        componentId: 'mastercard-click-to-pay'
      },
      '*'
    );

    (
      window as unknown as { mastercardClickToPayComponent: unknown }
    ).mastercardClickToPayComponent = {
      setCardData: (cardData: unknown) =>
        this.sendMessageWithPromise('SET_CARD_DATA', { cardData }),
      clearCardData: () => this.sendMessageWithPromise('CLEAR_CARD_DATA'),
      encryptCard: () => this.sendMessageWithPromise('TRIGGER_ENCRYPT_CARD'),
      checkoutWithNewCard: () =>
        this.sendMessageWithPromise('TRIGGER_CHECKOUT_NEW_CARD'),
      checkoutWithCard: () =>
        this.sendMessageWithPromise('TRIGGER_CHECKOUT_WITH_CARD'),
      getComponentState: () =>
        this.sendMessageWithPromise('GET_COMPONENT_STATE'),
      getCardStore: () => this.cardStore,
      getStore: () => this.store
    };
  }

  private sendMessageWithPromise(
    type: string,
    data?: unknown
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
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

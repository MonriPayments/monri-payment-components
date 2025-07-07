import {
  Component,
  HostListener,
  inject,
  Input,
  OnInit,
  OnDestroy,
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
import { MastercardEventsService } from './services/mastercard-events.service';
import { MastercardMessageHandlerService } from './services/mastercard-message-handler.service';
import { take } from 'rxjs';
import { StartPaymentRequest } from './interfaces/alternative-payment-method.interface';
import { MastercardClickToPayStore } from './store/mastercard-click-to-pay.store';
import { CardDataStore } from './store/card-data.store';
import { patchState } from '@ngrx/signals';
import { setFulfilled } from './store/request-status.feature';
import { ComplianceSettings } from './interfaces/mastercard-click-to-pay.interface';
import { ERROR_MESSAGES } from './constants/error-messages';

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
export class MastercardClickToPayComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private readonly injector = inject(Injector);
  readonly store = inject(MastercardClickToPayStore);
  readonly cardStore = inject(CardDataStore);
  private readonly _service = inject(MastercardClickToPayService);
  private readonly eventsService = inject(MastercardEventsService);
  private readonly messageHandler = inject(MastercardMessageHandlerService);

  // Cleanup tracking
  private cleanupTasks: (() => void)[] = [];

  @ViewChild('cardList', { static: false }) cardListRef?: ElementRef;
  @ViewChild('consent', { static: false }) consentRef?: ElementRef;

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.store, { inputParams: value });

    // Initialize card data if provided
    const encryptCardParams = value.data.encryptCardParams;
    if (
      encryptCardParams &&
      typeof encryptCardParams === 'object' &&
      'primaryAccountNumber' in encryptCardParams &&
      'panExpirationMonth' in encryptCardParams &&
      'panExpirationYear' in encryptCardParams &&
      'cardSecurityCode' in encryptCardParams
    ) {
      // Type assertion after validation
      this.cardStore.setCardData(
        encryptCardParams as {
          primaryAccountNumber: string;
          panExpirationMonth: string;
          panExpirationYear: string;
          cardSecurityCode: string;
        }
      );
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
        const authComplete = this.store.authenticationComplete();
        const isLoading = this.store.isLoadingCards();
        
        if (!isLoading && cards.length > 0) {
          this.loadCardsIntoComponent(cards);
        } else if (!isLoading && authComplete && cards.length === 0) {
          console.log('No cards found after authentication, showing consent for new card registration');
          this.setupConsentListener();
        }
      }, { allowSignalWrites: true });

      effect(() => {
        if (this.store.isFulfilled()) {
          this.store.onLoad(
            () => this.createModal(),
            () => this.closeModal()
          );
        }
      }, { allowSignalWrites: true });

      // Emit masked cards count changes (with optimization)
      let previousCount = 0;
      effect(() => {
        const maskedCardsCount = this.store.maskedCards().length;
        if (maskedCardsCount !== previousCount) {
          this.eventsService.emitMaskedCardsChanged(maskedCardsCount);
          previousCount = maskedCardsCount;
        }
      });

      // Emit authentication completion event
      let previousAuthComplete = false;
      effect(() => {
        const authComplete = this.store.authenticationComplete();
        const isLoading = this.store.isLoadingCards();
        
        if (authComplete && !isLoading && !previousAuthComplete) {
          const maskedCardsCount = this.store.maskedCards().length;
          this.eventsService.emitAuthenticationComplete(maskedCardsCount);
          previousAuthComplete = true;
        }
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
    const inputParams = this.store.inputParams();
    const data = inputParams.data;

    // Validate required fields
    if (!inputParams.payment_method) {
      throw new Error(
        `PAYMENT_METHOD_NOT_SET: ${ERROR_MESSAGES.PAYMENT_METHOD_NOT_SET}`
      );
    }

    if (inputParams.payment_method !== 'mastercard-click-to-pay') {
      throw new Error(
        `INVALID_PAYMENT_METHOD: ${ERROR_MESSAGES.INVALID_PAYMENT_METHOD}, got '${inputParams.payment_method}'`
      );
    }

    if (!data || typeof data !== 'object') {
      throw new Error(`INVALID_DATA: ${ERROR_MESSAGES.INVALID_DATA}`);
    }

    if (!data.locale || typeof data.locale !== 'string') {
      throw new Error(`LOCALE_NOT_SET: ${ERROR_MESSAGES.LOCALE_NOT_SET}`);
    }

    if (!inputParams.is_test) {
      if (!data.environment) {
        throw new Error(`ENV_NOT_SET: ${ERROR_MESSAGES.ENV_NOT_SET}`);
      }

      if (data.environment !== 'production' && data.environment !== 'sandbox') {
        throw new Error(
          `INVALID_ENVIRONMENT: ${ERROR_MESSAGES.INVALID_ENVIRONMENT}, got '${data.environment}'`
        );
      }
    }

    // Set environment if provided
    if (data.environment) {
      patchState(this.store, { environment: data.environment as string });
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
    // Store modal reference safely
    (window as { currentModal?: HTMLElement }).currentModal = modalWrapper;

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
    const windowWithModal = window as { currentModal?: HTMLElement };
    if (windowWithModal.currentModal) {
      windowWithModal.currentModal.remove();
      windowWithModal.currentModal = undefined;
    }
  }

  ngOnDestroy(): void {
    // Execute all cleanup tasks
    this.cleanupTasks.forEach(cleanup => cleanup());
    this.cleanupTasks = [];

    // Clean up message handlers
    this.messageHandler.cleanup();

    // Clean up modal if it exists
    this.closeModal();

    // Clean up window references
    const windowWithModal = window as {
      currentModal?: HTMLElement;
      mastercardClickToPayComponent?: unknown;
    };
    if (windowWithModal.mastercardClickToPayComponent) {
      delete windowWithModal.mastercardClickToPayComponent;
    }
  }

  private setupWindowMessageHandlers(): void {
    this.messageHandler.setupMessageHandlers({
      cardStore: this.cardStore,
      store: this.store,
      createModal: () => this.createModal(),
      closeModal: () => this.closeModal()
    });
  }
}

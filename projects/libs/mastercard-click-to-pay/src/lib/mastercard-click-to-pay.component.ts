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
import { patchState } from '@ngrx/signals';
import { setFulfilled } from './store/request-status.feature';
import { ComplianceSettings } from './interfaces/mastercard-click-to-pay.interface';

@Component({
  selector: 'lib-mastercard-click-to-pay',
  standalone: true,
  templateUrl: 'mastercard-click-to-pay.component.html',
  styleUrl: 'mastercard-click-to-pay.component.scss',
  providers: [MastercardClickToPayService, MastercardClickToPayStore],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MastercardClickToPayComponent implements OnInit, AfterViewInit {
  private readonly injector = inject(Injector);
  readonly store = inject(MastercardClickToPayStore);
  private readonly _service = inject(MastercardClickToPayService);

  @ViewChild('cardList', { static: false }) cardListRef?: ElementRef;
  @ViewChild('consent', { static: false }) consentRef?: ElementRef;

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.store, { inputParams: value });
    console.log(
      'Mastercard Click To Pay inputParams:',
      this.store.inputParams()
    );
    this.store.onLoad(
      () => this.createModal(),
      () => this.closeModal()
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
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const cards = this.store.maskedCards();
        if (cards.length > 0) {
          this.loadCardsIntoComponent(cards);
        } else {
          this.setupConsentListener();
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
}

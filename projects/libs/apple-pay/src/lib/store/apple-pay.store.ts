import {patchState, signalStore, StateSignal, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {computed, ElementRef, inject, Renderer2} from '@angular/core';
import {setPending, withRequestStatus} from './request-status.feature';
import {Prettify} from '@ngrx/signals/src/ts-helpers';
import {MethodsDictionary, SignalsDictionary, SignalStoreSlices} from '@ngrx/signals/src/signal-store-models';
import {StartPaymentRequest} from '../interfaces/alternative-payment-method.interface';
import {ApplePayButtonConfig} from '../models/apple-pay.models';
import {catchError, of, tap} from 'rxjs';
import {ApplePayService} from "../services/apple-pay.service";

export const ApplePayStore = signalStore(
  withState({
    appleButtonConfig: undefined as ApplePayButtonConfig | undefined,
    countryCode: '',
    currencyCode: '',
    supportedNetworks: [''],
    merchantCapabilities: [''],
    total: {label: '', amount: ''},
    environment: '',
    inputParams: {
      payment_method: '',
      data: {},
    } as StartPaymentRequest,
    resolution: window.innerWidth
  }),
  withRequestStatus(),
  withComputed(store => ({
    appleButtonStyle: computed(() => {
      return {
        buttonStyle: store.inputParams().data['buttonStyle'] || 'black',
        buttonType: store.inputParams().data['buttonType'],
        locale: store.inputParams().data['locale']
      };
    }),
    // isLoading: computed(() => store.isPending())
  })),
  withMethods(
    (
      store,
      renderer = inject(Renderer2),
      el = inject(ElementRef),
      applePayService = inject(ApplePayService)
    ) => {
      const loadApplePayScript = () => {
        return new Promise((resolve, reject) => {
          console.log('Script is loaded.');
          const script = renderer.createElement('script');
          script.src =
            'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
          script.crossOrigin = 'anonymous';
          script.onload = resolve;
          script.onerror = reject;
          renderer.appendChild(document.body, script);
        });
      };

      const onApplePayButtonClick = () => {
        if (!(window as any).ApplePaySession) {
          console.error('Apple Pay is not supported.');
          return;
        }

        const request = {
          countryCode: store.countryCode(),
          currencyCode: store.currencyCode(),
          supportedNetworks: store.supportedNetworks(),
          merchantCapabilities: store.merchantCapabilities(),
          total: {
            label: store.total.label(),
            amount: store.total.amount()
          }
        };

        const session = new (window as any).ApplePaySession(3, request);

        session.onvalidatemerchant = (event: { validationURL: string }) => {
          applePayService.validateMerchant(event.validationURL).pipe(
            tap((response) => session.completeMerchantValidation(response)),
            catchError((error) => {
              console.error('Error validating merchant:', error);
              session.abort();
              return of(null);
            })
          ).subscribe();
        };

        session.onpaymentauthorized = (event: any) => {
          return new Promise((resolve) => {
            applePayService.newTransaction(event.payment.token).pipe(
              tap((response) => {
                session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
                resolve(response);
              }),
              catchError((error) => {
                console.error("Error processing Apple Pay:", error);
                session.completePayment(window.ApplePaySession.STATUS_FAILURE);
                resolve(null);
                return of(null);
              })
            ).subscribe();
          });
        };
        session.begin();
      };


      const createApplePayButton = () => {
        const applePayButton = renderer.createElement('apple-pay-button');
        renderer.setAttribute(applePayButton, 'id', 'apple-pay-button');
        renderer.setAttribute(
          applePayButton,
          'buttonstyle',
          store.appleButtonStyle().buttonStyle || 'black'
        );
        renderer.setAttribute(
          applePayButton,
          'type',
          store.appleButtonStyle().buttonType
        );
        renderer.setAttribute(
          applePayButton,
          'locale',
          store.appleButtonStyle().locale
        );

        renderer.appendChild(
          el.nativeElement.querySelector('#container-apple'),
          applePayButton
        );
        console.log('Button is created.');
        renderer.listen(
          applePayButton,
          'click',
          onApplePayButtonClick.bind(this)
        );
      };

      const onLoad = () => {
        loadApplePayScript().then(() => {
          createApplePayButton();
        });
      };
      const setWindowServices = () => {
        window.applePayStore = store;
        window.applePayService = applePayService;
      };

      return {
        onLoad,
        setWindowServices
      };
    }
  ),
  withHooks({
    onInit(store) {
      patchState(
        store,
        setPending()
      );
      store.onLoad();
      store.setWindowServices();
    }
  })
);

declare global {
  interface Window {
    ApplePaySession?: any;
    applePayService: ApplePayService;
    applePayStore:
      | Prettify<
      SignalStoreSlices<object> &
      SignalsDictionary &
      MethodsDictionary &
      StateSignal<object>
    >
      | unknown;
  }
}

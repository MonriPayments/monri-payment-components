import {patchState, signalStore, StateSignal, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {computed, ElementRef, inject, Renderer2} from '@angular/core';
import {setPending, withRequestStatus} from './request-status.feature';
import {Prettify} from '@ngrx/signals/src/ts-helpers';
import {MethodsDictionary, SignalsDictionary, SignalStoreSlices} from '@ngrx/signals/src/signal-store-models';
import {StartPaymentRequest} from '../interfaces/alternative-payment-method.interface';
import {ApplePayButtonConfig} from '../models/apple-pay.models';
import {catchError, concatMap, of, pipe, switchMap, take, tap} from 'rxjs';
import {ApplePayService} from "../services/apple-pay.service";
import {rxMethod} from "@ngrx/signals/rxjs-interop";

export const ApplePayStore = signalStore(
  withState({
    appleButtonConfig: undefined as ApplePayButtonConfig | undefined,
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
        buttonType: store.inputParams().data['buttonType'] || 'buy',
        locale: store.inputParams().data['locale'] || 'hr'
      };
    })
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
          countryCode: 'HR',
          currencyCode: 'EUR',
          supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
          merchantCapabilities: ['supports3DS'],
          total: {
            label: 'Parkmatix',
            amount: '1.00'
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

        applePayService
          .startPayment(store.inputParams())
          .pipe(take(1))
          .subscribe(response => {
            console.log("Response:", response)
            request.countryCode = store.appleButtonConfig()?.countryCode || 'HR';
            request.currencyCode = store.appleButtonConfig()?.currencyCode || 'EUR';
            request.supportedNetworks = store.appleButtonConfig()?.supportedNetworks || ['visa', 'masterCard', 'amex', 'discover'];
            request.merchantCapabilities = store.appleButtonConfig()?.merchantCapabilities || ['supports3DS'];
            request.total = {
              label: store.appleButtonConfig()?.total.label || 'Parkmatix',
              amount: store.appleButtonConfig()?.total.amount || '1.50'
            };
          });

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
          store.appleButtonStyle().buttonType || 'buy'
        );
        renderer.setAttribute(
          applePayButton,
          'locale',
          store.appleButtonStyle().locale || 'en-US'
        );

        renderer.appendChild(
          el.nativeElement.querySelector('#container'),
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

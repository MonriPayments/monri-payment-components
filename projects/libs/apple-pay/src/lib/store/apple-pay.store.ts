import {
  patchState,
  signalStore,
  StateSignal,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import {computed, ElementRef, inject, Renderer2} from '@angular/core';
import {setPending, withRequestStatus} from './request-status.feature';
import {Prettify} from '@ngrx/signals/src/ts-helpers';
import {
  MethodsDictionary,
  SignalsDictionary,
  SignalStoreSlices
} from '@ngrx/signals/src/signal-store-models';
import {StartPaymentRequest} from '../interfaces/alternative-payment-method.interface';

export const ApplePayStore = signalStore(
  withState({
    environment: '',
    inputParams: {
      payment_method: '',
      data: {}
    } as StartPaymentRequest,
    resolution: window.innerWidth
  }),
  withRequestStatus(),
  withComputed(store => ({
    appleButtonStyle: computed(() => {
      return {
        buttonStyle: store.inputParams().data['buttonStyle'] || 'black',
        buttonType: store.inputParams().data['buttonType'] || 'buy',
        locale: store.inputParams().data['locale'] || 'en-US',
      }
    }),
    isMobileView: computed(() => store.resolution() <= 768),
    isLoading: computed(() => store.isPending())
  })),
  withMethods(
    (
      store,
      renderer = inject(Renderer2),
      el = inject(ElementRef)
    ) => {
      const loadApplePayScript = () => {
        return new Promise((resolve, reject) => {
          console.log("Script is loaded.")
          const script = renderer.createElement('script');
          script.src =
            'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
          script.crossOrigin = 'anonymous';
          script.onload = resolve;
          script.onerror = reject;
          renderer.appendChild(document.body, script);
        })
      }

      const onApplePayButtonClick = () => {
        const request = {
          //   countryCode: this.appleInputParams?.countryCode || 'HR',
          //   currencyCode: this.appleInputParams?.currencyCode || 'EUR',
          //   supportedNetworks: this.appleInputParams?.supportedNetworks || ['visa', 'masterCard', 'amex', 'discover'],
          //   merchantCapabilities: this.appleInputParams?.merchantCapabilities || ['supports3DS'],
          //   total: {
          //     label: this.appleInputParams?.totalLabel || "Parkmatix",
          //     amount: this.appleInputParams?.totalAmount || "2.00",
          //   }
        };
        // console.log("Request:", request)

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

      const createApplePayButton = () => {
        const applePayButton = renderer.createElement('apple-pay-button');
        renderer.setAttribute(applePayButton, 'id', 'apple-pay-button');
        renderer.setAttribute(applePayButton, 'buttonstyle', store.appleButtonStyle().buttonStyle || 'black');
        renderer.setAttribute(applePayButton, 'type', store.appleButtonStyle().buttonType || 'buy');
        renderer.setAttribute(applePayButton, 'locale', store.appleButtonStyle().locale || 'en-US');

        renderer.appendChild(
          el.nativeElement.querySelector('#container'),
          applePayButton
        );
        console.log("Button is created.")
        renderer.listen(
          applePayButton,
          'click',
          onApplePayButtonClick.bind(this)
        );
      }

      const onLoad = () => {
        loadApplePayScript().then(() => {
            createApplePayButton()
          }
        )
      }
      const setWindowServices = () => {
        window.applePayStore = store;
        // window.applePayService = applePayService;
        // window.translationService = translationService;
      }

      return {
        onLoad,
        setWindowServices
      }
    }
  ),
  withHooks({
    onInit(store) {
      patchState(store, setPending());
      store.onLoad();
      store.setWindowServices();
    }
  })
);

declare global {
  interface Window {
    // applePayService: KeksPayService;
    // translationService: TranslationService;
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

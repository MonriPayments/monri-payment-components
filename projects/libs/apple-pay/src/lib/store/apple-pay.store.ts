import {patchState, signalStore, StateSignal, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {computed, ElementRef, inject, Renderer2} from '@angular/core';
import {setPending, withRequestStatus} from './request-status.feature';
import {Prettify} from '@ngrx/signals/src/ts-helpers';
import {MethodsDictionary, SignalsDictionary, SignalStoreSlices} from '@ngrx/signals/src/signal-store-models';
import {StartPaymentRequest, TransactionStatus} from '../interfaces/alternative-payment-method.interface';
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
          console.log('Apple Pay script is loaded.');
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
          applePayService.validateMerchant({
            data: {trx_token: store.inputParams().data['trx_token']},
            validation_url: event.validationURL,
            initiative_context: window.location.hostname
          }).pipe(
            tap((response) => {
              session.completeMerchantValidation(response)
            }),
            catchError((error) => {
              console.error('Error validating merchant:', error);
              session.abort();
              return of(null);
            })
          ).subscribe();
        };

        session.onpaymentauthorized = (event: any) => {
          const transactionData = {
            trx_token: store.inputParams().data['trx_token'],
            language: 'en',
            ch_full_name: store.inputParams().data['transaction']['ch_full_name' as any],
            ch_address: store.inputParams().data['transaction']['ch_address' as any],
            ch_city: store.inputParams().data['transaction']['ch_city' as any],
            ch_zip: store.inputParams().data['transaction']['ch_zip' as any],
            ch_country: store.inputParams().data['transaction']['ch_country' as any],
            ch_phone: store.inputParams().data['transaction']['ch_phone' as any],
            ch_email: store.inputParams().data['transaction']['ch_email' as any],
            meta: store.inputParams().data['transaction']['meta' as any] || {},
            payment_method_type: 'apple-pay',
            payment_method_data: event.payment.token
          };
          return new Promise((resolve) => {
            applePayService.newTransaction({transaction: transactionData}).pipe(
              tap((response) => {
                const transactionStatus = response?.transaction?.status;
                if (transactionStatus === TransactionStatus.approved) {
                  session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
                } else {
                  session.completePayment(window.ApplePaySession.STATUS_FAILURE);
                }
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

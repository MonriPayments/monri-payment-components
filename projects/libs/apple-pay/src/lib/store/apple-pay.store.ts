import {patchState, signalStore, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {computed, ElementRef, inject, Renderer2} from '@angular/core';
import {StartPaymentRequest} from '../interfaces/alternative-payment-method.interface';
import {ApplePayButtonConfig, MessageType} from '../models/apple-pay.models';
import {catchError, of, take, tap} from 'rxjs';
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
  withComputed(store => ({
    appleButtonStyle: computed(() => {
      return {
        buttonStyle: store.inputParams().data['buttonStyle'] || 'black',
        buttonType: store.inputParams().data['buttonType'] || 'buy',
        locale: store.inputParams().data['locale'] || 'en-US'
      };
    }),
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
          const script = renderer.createElement('script');
          script.src =
            'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
          script.onload = resolve;
          script.onerror = reject;
          script.async = true;
          renderer.appendChild(document.body, script);
        });
      };

      const onApplePayButtonClick = () => {
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

        window.parent.postMessage({type: MessageType.START_APPLE_PAY_SESSION, request, requestId: Date.now()}, '*');
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

      const startPayment = () => {
        applePayService
          .startPayment(store.inputParams())
          .pipe(take(1))
          .subscribe(response => {
            patchState(store, {
              countryCode: response.country_code,
              currencyCode: response.currency_code,
              supportedNetworks: response.supported_networks,
              merchantCapabilities: response.merchant_capabilities,
              total: {label: response.total.label, amount: response.total.amount},
            });
            createApplePayButton();
          });
      }


      const handleMessage = async (event: MessageEvent) => {
        const {type, payload, requestId} = event.data;

        if (type === MessageType.SET_INPUT) {
          patchState(store, {inputParams: payload.inputParams})
          loadApplePayScript().then(() => startPayment())
        }
        if (type === MessageType.VALIDATE_MERCHANT) {
          applePayService.validateMerchant({
            data: store.inputParams().data,
            validation_url: payload.validationURL,
            origin: new URL(event.origin).hostname
          }).pipe(
            tap((response) => {
              window.parent.postMessage({type: MessageType.MERCHANT_VALIDATION_RESULT, response, requestId}, '*');
            }),
            catchError((error) => {
              window.parent.postMessage({type: MessageType.MERCHANT_VALIDATION_ERROR, error}, '*');
              return of(null);
            })
          ).subscribe();
        }
        if (type === MessageType.PAYMENT_AUTHORIZED) {
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
            payment_method_data: payload?.payment.token
          };
          applePayService.newTransaction({transaction: transactionData}, store.inputParams().data['environment']).pipe(
            tap((response) => {
              if (response.transaction) {
                window.parent.postMessage({
                  type: MessageType.PAYMENT_RESULT,
                  transaction: response.transaction,
                  requestId
                }, '*');
              } else if (response.secure_message) {
                window.parent.postMessage({
                  type: MessageType.SECURE_MESSAGE_RESULT,
                  secureMessage: response.secure_message,
                  requestId
                }, '*');
              }
            }),
            catchError((error) => {
              console.error("Error processing Apple Pay:", error);
              window.parent.postMessage({type: MessageType.PAYMENT_RESULT, transaction: null, requestId}, '*');
              return of(null);
            })
          ).subscribe();
        }
      };

      return {
        handleMessage
      };
    }
  ),
  withHooks({
    onInit(store) {
      window.addEventListener('message', store.handleMessage.bind(this));
    },
    onDestroy(store) {
      window.removeEventListener('message', store.handleMessage.bind(this));
    }
  })
);

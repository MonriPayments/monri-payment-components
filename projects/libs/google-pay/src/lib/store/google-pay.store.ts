import {patchState, signalStore, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {computed, ElementRef, inject, Renderer2} from '@angular/core';
import {StartPaymentRequest} from '../interfaces/alternative-payment-method.interface';
import {GooglePayService} from '../services/google-pay.service';
import {catchError, of, take, tap} from 'rxjs';
import {
  GoogleErrorState,
  GoogleIsReadyToPayRequest,
  GooglePaymentDataRequest,
  GoogleTransactionInfo,
  GoogleTransactionState, MessageType
} from '../models/google-pay.models';
import {withRequestStatus} from './request-status.feature';

declare var google: any;

type GooglePayState = {
  googleTransactionInfo: GoogleTransactionInfo | undefined;
  googlePaymentDataRequest: GooglePaymentDataRequest;
  googleIsReadyToPayRequest: GoogleIsReadyToPayRequest | undefined;
  googleErrorState: GoogleErrorState | undefined;
  googleTransactionState: GoogleTransactionState | undefined;
  inputParams: StartPaymentRequest;
  resolution: number;
};

const initialState: GooglePayState = {
  googleTransactionInfo: undefined,
  googlePaymentDataRequest: {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'monripayments',
            gatewayMerchantId: 'webPayMerchantId1',
          }
        }
      }
    ],
    transactionInfo: {
      countryCode: 'US',
      currencyCode: 'EUR',
      totalPriceStatus: 'FINAL',
      totalPrice: '3.15',
    },
    merchantInfo: {
      merchantId: 'BCR2DN4TQHE6DYLO',
      merchantName: 'Monri Payments'
    },
    callbackIntents: ['PAYMENT_AUTHORIZATION'],
  },
  googleIsReadyToPayRequest: {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['MASTERCARD', 'VISA']
        }
      }
    ]
  },
  googleErrorState: undefined,
  googleTransactionState: undefined,
  inputParams: {
    payment_method: 'google-pay',
    environment: 'TEST',
    data: {},
  },
  resolution: window.innerWidth
};

export const GooglePayStore = signalStore(
  withState<GooglePayState>(initialState),
  withRequestStatus(),
  withComputed(store => ({
    googleButtonStyle: computed(() => {
      return {
        buttonStyle: store.inputParams().data['buttonStyle'] || 'default',
        buttonType: store.inputParams().data['buttonType'] || 'buy',
        buttonLocale: store.inputParams().data['locale'] || 'en'
      };
    }),
  })),
  withMethods(
    (
      store,
      renderer = inject(Renderer2),
      el = inject(ElementRef),
      googlePayService = inject(GooglePayService)
    ) => {
      const loadGooglePayScript = () => {
        return new Promise((resolve, reject) => {
          const script = renderer.createElement('script');
          script.src = 'https://pay.google.com/gp/p/js/pay.js';
          script.onload = resolve;
          script.async = true;
          script.onerror = reject;
          renderer.appendChild(document.body, script);
        });
      };

      const startPayment = () => {
        googlePayService
          .startPayment(store.inputParams())
          .pipe(take(1))
          .subscribe(response => {
            patchState(store, {
              googleTransactionInfo: response?.transactionInfo,
              googlePaymentDataRequest: {
                ...store.googlePaymentDataRequest(),
                allowedPaymentMethods: [response?.allowedPaymentMethods],
                merchantInfo: response.merchantInfo,
                callbackIntents: response.callbackIntents || ['PAYMENT_AUTHORIZATION'],
              },
              googleIsReadyToPayRequest: {
                apiVersion: 2,
                apiVersionMinor: 0,
                allowedPaymentMethods: [response?.allowedPaymentMethods]
              },
              googleErrorState: response?.googleErrorState,
              googleTransactionState: response?.googleTransactionState
            });
            createGooglePayButton();
          });
      };

      const createGooglePayButton = () => {
        const paymentsClient = new google.payments.api.PaymentsClient({
          environment: store.inputParams().environment === 'test' ? 'TEST' : 'PRODUCTION',
        });

        paymentsClient.isReadyToPay(store.googleIsReadyToPayRequest())
          .then((response: any) => {
            if (response.result) {
              const button = paymentsClient.createButton({
                onClick: onGooglePayButtonClick,
                buttonColor: store.googleButtonStyle().buttonStyle,
                buttonType: store.googleButtonStyle().buttonType,
                buttonLocale: store.googleButtonStyle().buttonLocale
              });
              renderer.appendChild(
                el.nativeElement.querySelector('#container-google'),
                button
              );
            }
          })
          .catch((err: any) => {
            window.parent.postMessage({
              type: MessageType.MERCHANT_VALIDATION_ERROR,
              error: err,
              requestId: Date.now()
            }, '*');
          });
      };

      const onGooglePayButtonClick = () => {
        const paymentDataRequest = {
          ...store.googlePaymentDataRequest(),
          transactionInfo: store.googleTransactionInfo()
        };
        window.parent.postMessage({
          type: MessageType.START_GOOGLE_PAY_SESSION,
          request: paymentDataRequest,
          requestId: Date.now()
        }, '*');
      };

      const handleMessage = async (event: MessageEvent) => {
        const {type, payload, requestId} = event.data;

        if (type === MessageType.SET_INPUT) {
          patchState(store, {
            inputParams: payload.inputParams
          });
          loadGooglePayScript().then(() => startPayment());
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
            browser_info: store.inputParams().data['transaction']['browser_info' as any],
            payment_method_type: 'google-pay',
            payment_method_data: payload?.payment?.paymentMethodData?.tokenizationData?.token
          };

          googlePayService.newTransaction({transaction: transactionData}).pipe(
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
            catchError(() => {
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

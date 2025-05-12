import {patchState, signalStore, StateSignal, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {Prettify} from '@ngrx/signals/src/ts-helpers';
import {MethodsDictionary, SignalsDictionary, SignalStoreSlices} from '@ngrx/signals/src/signal-store-models';
import {GooglePayService} from "../services/google-pay.service";
import {StartPaymentRequest, TransactionStatus} from "../interfaces/alternative-payment-method.interface";
import {setFulfilled, withRequestStatus} from "./request-status.feature";
import {computed, ElementRef, inject, Renderer2} from '@angular/core';
import {
  GoogleErrorState,
  GoogleIsReadyToPayRequest,
  GooglePaymentDataRequest,
  GoogleTransactionInfo,
  GoogleTransactionState
} from "../models/google-pay.models";
import {catchError, of, take, tap} from "rxjs";

declare var google: any;
type GooglePayState = {
  googleTransactionInfo: GoogleTransactionInfo | undefined
  googlePaymentDataRequest: GooglePaymentDataRequest
  googleIsReadyToPayRequest: GoogleIsReadyToPayRequest | undefined
  googleErrorState: GoogleErrorState | undefined
  googleTransactionState: GoogleTransactionState | undefined
  inputParams: StartPaymentRequest
}
const initialState: GooglePayState = {
  googleTransactionInfo: {
    countryCode: 'US',
    currencyCode: 'EUR',
    totalPriceStatus: 'FINAL',
    totalPrice: '3.15',
  },
  googlePaymentDataRequest: {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: [
            'AMEX',
            'DISCOVER',
            'INTERAC',
            'JCB',
            'MASTERCARD',
            'VISA'
          ]
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
    allowedPaymentMethods: [{
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['MASTERCARD', 'VISA']
      }
    }]
  },
  googleErrorState: undefined,
  googleTransactionState: undefined,
  inputParams: {
    payment_method: 'google-pay',
    environment: 'test',
    data: {},
  }
}

export const GooglePayStore = signalStore(
  withState<GooglePayState>(initialState),
  withRequestStatus(),
  withComputed(store => ({
    googleButtonStyle: computed(() => {
      return {
        buttonStyle: store.inputParams()?.data['buttonStyle'],
        buttonType: store.inputParams()?.data['buttonType'],
        buttonLocale: store.inputParams()?.data['buttonLocale']
      };
    }),
    isLoading: computed(() => store.isPending())
  })),
  withMethods(
    (
      store,
      renderer = inject(Renderer2),
      el = inject(ElementRef),
      googlePayService = inject(GooglePayService)
    ) => {
      // TODO: replace multiple any with response models

      const loadGooglePayScript = () => {
        const script = document.createElement('script');
        script.src = 'https://pay.google.com/gp/p/js/pay.js';
        script.onload = () => onGooglePayLoaded();
        document.body.appendChild(script);
      }

      const onGooglePayLoaded = () => {
        const paymentsClient = getGooglePaymentsClient();
        paymentsClient.isReadyToPay(store.googleIsReadyToPayRequest())
          .then((response: any) => {
            if (response.result) {
              addGooglePayButton();
            }
          })
          .catch((err: any) => {
            console.error(err);
          });
      }

      const getGooglePaymentsClient = () => {
        return new google.payments.api.PaymentsClient({
          paymentDataCallbacks: {
            environment: store.inputParams().environment,
            onPaymentAuthorized: (paymentData: any) =>
              onPaymentAuthorized(paymentData)
          }
        });
      }

      const onPaymentAuthorized = (paymentData: any) => {
        return new Promise((resolve) => {
          processPayment(paymentData)
            .then(() => {
              console.log('Google Pay Payment successful.');
              resolve({transactionState: store.googleTransactionState()?.onSuccess});
            })
            .catch((error) => {
              console.log('Google Pay Payment failed:', error);
              resolve({
                transactionState: store.googleTransactionState()?.onError,
                error: store.googleErrorState()
              });
            });
        });
      };


      const addGooglePayButton = () => {
        const paymentsClient = getGooglePaymentsClient();

        const button = paymentsClient.createButton({
          onClick: () => onGooglePaymentButtonClicked(),
          buttonColor: store.googleButtonStyle().buttonStyle,
          buttonType: store.googleButtonStyle().buttonType,
          buttonLocale: store.googleButtonStyle().buttonLocale
        });

        renderer.appendChild(
          el.nativeElement.querySelector('#container-google'),
          button
        );
      };

      const onGooglePaymentButtonClicked = () => {
        let paymentDataRequest = store.googlePaymentDataRequest();
        if (!paymentDataRequest) {
          console.log("No paymentDataRequest found.");
          return;
        }
        paymentDataRequest['transactionInfo'] = store.googleTransactionInfo() as GoogleTransactionInfo;
        const paymentsClient = getGooglePaymentsClient();
        paymentsClient.loadPaymentData(paymentDataRequest)
      };

      const processPayment = (paymentData: any) => {
        return new Promise((resolve, reject) => {
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
            payment_method_type: 'google-pay',
            payment_method_data: paymentData?.paymentMethodData?.tokenizationData?.token
          };

          googlePayService.newTransaction({transaction: transactionData}, store.inputParams().data['environment']).pipe(
            tap((response) => {
              const transactionStatus = response?.transaction?.status;
              if (transactionStatus === TransactionStatus.approved) {
                resolve(response);
              }
            }),
            catchError((error) => {
              console.error("Google Pay processPayment failed:", error);
              reject(error);
              return of(null);
            })
          ).subscribe();
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
                callbackIntents: response.callbackIntents,
                // callbackIntents: ['PAYMENT_AUTHORIZATION'],
              },
              googleIsReadyToPayRequest: {
                apiVersion: 2,
                apiVersionMinor: 0,
                allowedPaymentMethods: [response?.allowedPaymentMethods]
              },
              googleErrorState: response?.googleErrorState,
              googleTransactionState: response?.googleTransactionState
            }, setFulfilled());
          });
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SET_INPUT') {
          patchState(store, {
            inputParams: event.data.payload.inputParams
          })
          loadGooglePayScript();
          startPayment();
        }
      };

      return {
        loadGooglePayScript,
        handleMessage
      };
    }
  ),
  withHooks({
    onInit(store) {
      window.addEventListener('message', store.handleMessage.bind(this));
    }
  })
);

declare global {
  interface Window {
    GooglePaySession?: any;
  }
}

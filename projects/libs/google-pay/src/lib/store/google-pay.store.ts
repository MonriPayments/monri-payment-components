import {patchState, signalStore, StateSignal, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {Prettify} from '@ngrx/signals/src/ts-helpers';
import {MethodsDictionary, SignalsDictionary, SignalStoreSlices} from '@ngrx/signals/src/signal-store-models';
import {GooglePayService} from "../services/google-pay.service";
import {StartPaymentRequest} from "../interfaces/alternative-payment-method.interface";
import {withRequestStatus} from "./request-status.feature";
import {computed, ElementRef, inject, Renderer2} from '@angular/core';
import {
  GoogleErrorState,
  GoogleIsReadyToPayRequest,
  GooglePaymentDataRequest,
  GoogleTransactionInfo,
  GoogleTransactionState
} from "../models/google-pay.models";

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
    totalPrice: '2.15',
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
            gateway: 'example',
            gatewayMerchantId: 'exampleGatewayMerchantId'
          }
        }
      }
    ],
    transactionInfo: {
      countryCode: 'US',
      currencyCode: 'EUR',
      totalPriceStatus: 'FINAL',
      totalPrice: '2.15',
    },
    merchantInfo: {
      merchantId: 'BCR2DN4TQHE6DYLO',
      merchantName: 'Monri'
    },
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
    environment: 'TEST',
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
    // isLoading: computed(() => store.isPending())
  })),
  withMethods(
    (
      store,
      renderer = inject(Renderer2),
      el = inject(ElementRef),
      googlePayService = inject(GooglePayService)
    ) => {

      const loadGooglePayScript = () => {
        const script = document.createElement('script');
        script.src = 'https://pay.google.com/gp/p/js/pay.js';
        script.onload = () => onGooglePayLoaded();
        document.body.appendChild(script);
      }

      const onGooglePayLoaded = () => {
        const paymentsClient = getGooglePaymentsClient();
        console.log("googleIsReadyToPayRequest iz Store:", store.googleIsReadyToPayRequest());
        paymentsClient
          .isReadyToPay(store.googleIsReadyToPayRequest())
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
        console.log("getGooglePaymentsClient")
        return new google.payments.api.PaymentsClient({
          environment: store.inputParams().environment,
          onPaymentAuthorized: (paymentData: any) =>
            onPaymentAuthorized(paymentData)
        });
      }

      const onPaymentAuthorized = (paymentData: any) => {
        (window as any).PAYMENT_AUTHORIZED_EVENT = paymentData;
        return new Promise((resolve) => {
          processPayment(paymentData)
            .then(() => {
              console.log('Payment successful!');
              resolve({transactionState: store.googleTransactionState()?.onSuccess});
            })
            .catch(() => {
              console.log('Payment failed. Insufficient funds. Please try again.');
              resolve({
                transactionState: store.googleTransactionState()?.onError,
                error: store.googleErrorState()
              });
            });
        });
      };


      const addGooglePayButton = () => {
        console.log('addGooglePayButton.');
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
        console.log('Google Pay button clicked.');
        let paymentDataRequest = store.googlePaymentDataRequest();
        if (!paymentDataRequest) {
          console.log("No paymentDataRequest found.");
          return;
        }
        paymentDataRequest['transactionInfo'] = store.googleTransactionInfo() as GoogleTransactionInfo;

        const paymentsClient = getGooglePaymentsClient();

        console.log("loadPaymentData...");
        paymentsClient.loadPaymentData(paymentDataRequest)
          .then((paymentData: any) => {
            console.log("Payment data loaded", paymentData);
            (window as any).PAYMENT_AUTHORIZED_EVENT = paymentData
          })
          .catch((error: any) => {
            console.error("Error loading payment data", error);
          });
      };


      const processPayment = (paymentData: any) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log(paymentData);
            paymentData.paymentMethodData.tokenizationData.token;
            resolve({});
          }, 3000);
        });
      }

      const setWindowServices = () => {
        window.googlePayStore = store;
        window.googlePayService = googlePayService;
      };

      return {
        loadGooglePayScript,
        // onLoad,
        setWindowServices
      };
    }
  ),
  withHooks({
    onInit(store) {
      store.loadGooglePayScript();
      patchState(
        store
        // setPending()
      );
      store.setWindowServices();
    }
  })
);

declare global {
  interface Window {
    GooglePaySession?: any;
    googlePayService: GooglePayService;
    googlePayStore:
      | Prettify<
      SignalStoreSlices<object> &
      SignalsDictionary &
      MethodsDictionary &
      StateSignal<object>
    >
      | unknown;
  }
}

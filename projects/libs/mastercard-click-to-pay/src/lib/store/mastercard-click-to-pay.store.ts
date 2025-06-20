import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
  StateSignal
} from '@ngrx/signals';
import { computed, ElementRef, inject, Renderer2 } from '@angular/core';
import { withRequestStatus, setPending } from './request-status.feature';
import { StartPaymentRequest } from '../interfaces/alternative-payment-method.interface';
import { MastercardClickToPayService } from '../services/mastercard-click-to-pay.service';
import { Prettify } from '@ngrx/signals/src/ts-helpers';
import {
  MethodsDictionary,
  SignalsDictionary,
  SignalStoreSlices
} from '@ngrx/signals/src/signal-store-models';

export const MastercardClickToPayStore = signalStore(
  withState({
    inputParams: {
      payment_method: '',
      data: {}
    } as StartPaymentRequest,
    resolution: window.innerWidth,
    checkoutUrl: '',
    buttonStyle: '',
    environment: ''
  }),
  withRequestStatus(),
  withComputed(store => ({
    locale: computed(() => store.inputParams().data['locale']),
    srcDpaId: computed(() => store.inputParams().data['srcDpaId'])
  })),
  withMethods(
    (
      store,
      renderer = inject(Renderer2),
      el = inject(ElementRef),
      mastercardService = inject(MastercardClickToPayService)
    ) => {
      const getScriptDomain = () =>
        store.environment() === 'production'
          ? 'https://src.mastercard.com'
          : 'https://sandbox.src.mastercard.com';

      const loadScript = (src: string, type?: string) => {
        return new Promise((resolve, reject) => {
          const script = renderer.createElement('script');
          script.src = src;
          if (type) script.type = type;
          script.onload = resolve;
          script.onerror = reject;
          renderer.appendChild(document.body, script);
        });
      };

      const loadStylesheet = (href: string) => {
        return new Promise((resolve, reject) => {
          const link = renderer.createElement('link');
          link.href = href;
          link.rel = 'stylesheet';
          link.onload = resolve;
          link.onerror = reject;
          renderer.appendChild(document.head, link);
        });
      };

      const loadMastercardScript = () =>
        loadScript(
          `${getScriptDomain()}/srci/integration/2/lib.js?srcDpaId=${store.srcDpaId()}&locale=${store.locale()}`
        );

      const loadMastercardUIStyle = () =>
        loadStylesheet(
          'https://src.mastercard.com/srci/integration/components/src-ui-kit/src-ui-kit.css'
        );

      const loadMastercardUIScript = () =>
        loadScript(
          'https://src.mastercard.com/srci/integration/components/src-ui-kit/src-ui-kit.esm.js',
          'module'
        );

      const initClickToPay = async () => {
        const MastercardCheckoutServices = window['MastercardCheckoutServices'];
        if (!MastercardCheckoutServices) {
          console.error(
            'MastercardCheckoutServices is not available on the window object.'
          );
          return;
        }

        try {
          const mcCheckoutService = new MastercardCheckoutServices();
          const initData = {
            srcDpaId: store.srcDpaId(),
            dpaData: { dpaName: 'Testdpa0' },
            dpaTransactionOptions: { dpaLocale: store.locale() },
            cardBrands: ['mastercard', 'visa']
          };

          const result = await mcCheckoutService.init(initData);
          window.mcCheckoutServices = result;
          console.log('Mastercard Click to Pay init successful:', result);
        } catch (error) {
          console.error('Mastercard Click to Pay init() failed:', error);
        }
      };

      const createConsentComponent = () => {
        const consentComponent = renderer.createElement('src-consent');
        renderer.appendChild(
          el.nativeElement.querySelector('#container-mastercard'),
          consentComponent
        );
      };

      /*
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
      */

      /*
      const onMastercardButtonClick = () => {
        const mcCheckoutServices = window.mcCheckoutServices;
        if (!mcCheckoutServices) {
          console.error('Mastercard Click to Pay nije inicijaliziran.');
          return;
        }

        console.log('Pokreni Click to Pay tok...');
        // TODO: Dodaj custom logiku, otvori modal, redirect, getCards(), itd.
      };

      const createClickToPayButton = () => {
        const button = renderer.createElement('button');
        renderer.setAttribute(button, 'id', 'mastercard-clicktopay-button');
        renderer.setStyle(button, 'background', '#F79E1B');
        renderer.setStyle(button, 'color', '#000');
        renderer.setStyle(button, 'padding', '12px 24px');
        renderer.setStyle(button, 'border', 'none');
        renderer.setStyle(button, 'borderRadius', '8px');
        renderer.setStyle(button, 'fontWeight', 'bold');
        renderer.setStyle(button, 'cursor', 'pointer');
        renderer.setProperty(
          button,
          'innerText',
          'Click to Pay with Mastercard'
        );

        const container = el.nativeElement.querySelector(
          '#container-mastercard'
        );
        if (container) {
          renderer.appendChild(container, button);
          renderer.listen(button, 'click', onMastercardButtonClick);
        } else {
          console.warn('#container-mastercard nije pronađen u DOM-u.');
        }
      };
      */

      const onLoad = async () => {
        try {
          const [mastercardScript, uiStyle, uiScript] = [
            loadMastercardScript(),
            loadMastercardUIStyle(),
            loadMastercardUIScript()
          ];

          await mastercardScript;
          await initClickToPay();
          await Promise.all([uiStyle, uiScript]);
          createConsentComponent();
        } catch (err) {
          console.error('Error loading Mastercard Click to Pay:', err);
        }
      };

      const setWindowServices = () => {
        window.mastercardClickToPayStore = store;
        window.mastercardClickToPayService = mastercardService;
      };

      return {
        onLoad,
        setWindowServices
      };
    }
  ),
  withHooks({
    onInit(store) {
      patchState(store, setPending());
      store.setWindowServices();
    }
  })
);

declare global {
  interface Window {
    mcCheckoutServices?: any;
    MastercardCheckoutServices?: any;
    MastercardClickToPaySession?: any;
    mastercardClickToPayService: MastercardClickToPayService;
    mastercardClickToPayStore:
      | Prettify<
          SignalStoreSlices<object> &
            SignalsDictionary &
            MethodsDictionary &
            StateSignal<object>
        >
      | unknown;
  }
}

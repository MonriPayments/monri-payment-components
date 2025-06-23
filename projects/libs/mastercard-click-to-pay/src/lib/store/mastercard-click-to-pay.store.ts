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
    environment: '',
    availableCardBrands: [] as Array<string>,
    availableServices: [],
    maskedCards: [],
    encryptedCard: '',
    cardBrand: ''
  }),
  withRequestStatus(),
  withComputed(store => ({
    locale: computed(() => store.inputParams().data['locale']),
    srcDpaId: computed(() => store.inputParams().data['srcDpaId']),
    darkTheme: computed(() => store.inputParams().data['darkTheme'] || false),
    email: computed(() => store.inputParams().data['consumer']?.email),
    phone: computed(() => {
      const consumer = store.inputParams().data['consumer'];
      if (consumer?.mobileNumber) {
        return `+${consumer.mobileNumber.countryCode}${consumer.mobileNumber.phoneNumber}`;
      }
      return undefined;
    }),
    encryptCardParams: computed(
      () => store.inputParams().data['encryptCardParams'] || undefined
    )
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
          window.mcCheckoutServices = mcCheckoutService;
          patchState(store, {
            availableCardBrands: result['availableCardBrands'],
            availableServices: result['availableServices']
          });

          console.log('Mastercard Click to Pay init successful');
        } catch (error) {
          console.error('Mastercard Click to Pay init() failed:', error);
        }
      };

      const getCards = async () => {
        if (!window.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
        }

        try {
          const cardsResponse = await window.mcCheckoutServices.getCards();
          patchState(store, { maskedCards: cardsResponse });
          console.log('getCards response:', cardsResponse);
        } catch (error) {
          console.error('getCards failed:', error);
        }
      };

      const authenticate = async () => {
        if (!window.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return;
        }

        const phone = store.phone();
        const email = store.email();

        if (!phone && !email) {
          throw new Error(
            'Either phone number or email address must be provided for authentication'
          );
        }

        try {
          let consumerIdentity;

          const modal = createModal();

          if (phone) {
            consumerIdentity = {
              identityType: 'MOBILE_PHONE_NUMBER',
              identityValue: phone
            };
          } else {
            consumerIdentity = {
              identityType: 'EMAIL_ADDRESS',
              identityValue: email
            };
          }

          //const popup = openCenteredPopup('', 480, 600);
          //window.currentPopup = popup;

          const authenticateData = {
            windowRef: modal,
            accountReference: {
              consumerIdentity
            },
            requestRecognitionToken: true
          };

          const authenticateResponse =
            await window.mcCheckoutServices.authenticate(authenticateData);
          patchState(store, { maskedCards: authenticateResponse.cards });
          console.log('authenticate response:', authenticateResponse);

          // Close popup after successful authentication
          closeModal();
        } catch (error) {
          console.error('authenticate failed:', error);
          closeModal();
        }
      };

      const encryptCard = async () => {
        if (!window.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return;
        }

        try {
          const encryptCardResponse =
            await window.mcCheckoutServices.encryptCard(
              store.encryptCardParams()
            );
          patchState(store, {
            encryptedCard: encryptCardResponse.encryptedCard,
            cardBrand: encryptCardResponse.cardBrand
          });
          console.log('encryptCard response:', encryptCardResponse);
        } catch (error) {
          console.error('encryptCard failed:', error);
        }
      };

      const checkoutWithNewCard = async () => {
        if (!window.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return;
        }

        try {
          const consumer = store.inputParams().data['consumer'];

          const modal = createModal();

          //const popup = openCenteredPopup('', 480, 600);
          //window.currentPopup = popup;

          const checkoutWithNewCardData: any = {
            windowRef: modal,
            encryptedCard: store.encryptedCard(),
            cardBrand: store.cardBrand(),
            recognitionTokenRequested: true
          };

          // Add consumer data if available
          if (consumer) {
            checkoutWithNewCardData.consumer = {
              emailAddress: consumer.email,
              mobileNumber: consumer.mobileNumber,
              firstName: consumer.firstName,
              lastName: consumer.lastName
            };
          }

          console.log(checkoutWithNewCardData);

          const checkoutWithNewCardResponse =
            await window.mcCheckoutServices.checkoutWithNewCard(
              checkoutWithNewCardData
            );

          patchState(store, {
            maskedCards:
              checkoutWithNewCardResponse.checkoutResponseData.maskedCard
          });

          console.log(
            'checkoutWithNewCard response:',
            checkoutWithNewCardResponse
          );

          // Close popup after successful checkout
          closeModal();
        } catch (error) {
          console.error('checkoutWithNewCard failed:', error);
          closeModal();
        }
      };

      const createModal = () => {
        const modalWrapper = document.createElement('div');
        modalWrapper.style.position = 'fixed';
        modalWrapper.style.top = '0';
        modalWrapper.style.left = '0';
        modalWrapper.style.width = '100vw';
        modalWrapper.style.height = '100vh';
        modalWrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalWrapper.style.display = 'flex';
        modalWrapper.style.justifyContent = 'center';
        modalWrapper.style.alignItems = 'center';
        modalWrapper.style.zIndex = '10000';

        modalWrapper.addEventListener('click', e => {
          if (e.target === modalWrapper) {
            closeModal();
          }
        });

        document.body.appendChild(modalWrapper);
        window.currentModal = modalWrapper;

        const modal = document.createElement('div');
        modal.style.width = '480px';
        modal.style.height = '600px';
        modal.style.backgroundColor = 'white';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';

        modalWrapper.appendChild(modal);

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        modal.appendChild(iframe);

        return iframe.contentWindow;
      };

      const closeModal = () => {
        if (window.currentModal) {
          window.currentModal.remove();
          window.currentModal = null;
        }
      };

      /*
      const openCenteredPopup = (
        url: string,
        width: number,
        height: number
      ) => {
        // Get the screen's width and height
        const screenWidth =
          window.innerWidth ||
          document.documentElement.clientWidth ||
          window.screen.width;
        const screenHeight =
          window.innerHeight ||
          document.documentElement.clientHeight ||
          window.screen.height;

        // Calculate the left and top position to center the popup
        const left = (screenWidth - width) / 2;
        const top = (screenHeight - height) / 2;

        console.log(left, top);

        // Open the popup with the calculated dimensions and position
        const popup = window.open(
          url,
          '_blank',
          `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`
        );

        if (!popup) {
          alert('Pop-up blocked! Please allow pop-ups for this site.');
          return null;
        }

        popup.document.body.style.margin = '0';
        popup.document.body.style.display = 'flex';
        popup.document.body.style.justifyContent = 'center';
        popup.document.body.style.alignItems = 'center';
        popup.document.body.style.height = '100vh';

        // Optional: focus the new window
        popup.focus();
        return popup;
      };

      const closeCurrentPopup = () => {
        if (window.currentPopup && !window.currentPopup.closed) {
          window.currentPopup.close();
          window.currentPopup = null;
        }
      };
      */

      const createConsentComponent = () => {
        const consentComponent = renderer.createElement('src-consent');
        renderer.setAttribute(consentComponent, 'locale', store.locale());
        renderer.setAttribute(consentComponent, 'dcf-suppressed', 'true');
        renderer.setAttribute(consentComponent, 'display-remember-me', 'false');
        if (store.darkTheme()) {
          renderer.setAttribute(consentComponent, 'dark', '');
        }
        renderer.appendChild(
          el.nativeElement.querySelector('#container-mastercard'),
          consentComponent
        );
      };

      const createCardListComponent = () => {
        const cardListComponent = renderer.createElement('src-card-list');
        renderer.setAttribute(cardListComponent, 'locale', store.locale());
        renderer.setAttribute(
          cardListComponent,
          'card-brands',
          store.availableCardBrands().join(',')
        );
        renderer.setAttribute(
          cardListComponent,
          'card-selection-type',
          'radioButton'
        );
        if (store.darkTheme()) {
          renderer.setAttribute(cardListComponent, 'dark', '');
        }
        renderer.appendChild(
          el.nativeElement.querySelector('#container-mastercard'),
          cardListComponent
        );
        cardListComponent.loadCards(store.maskedCards());
      };

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

          await getCards();
          if (store.maskedCards().length > 0) {
            // User has saved cards
            console.log('User has saved cards:', store.maskedCards());
            createCardListComponent();
          } else {
            // User has no saved cards
            await authenticate();

            if (store.maskedCards().length > 0) {
              // User has saved cards after authenticate
              console.log('User has saved cards:', store.maskedCards());
              createCardListComponent();
            } else {
              // User has no saved cards after authenticate
              createConsentComponent();

              await encryptCard();
              await checkoutWithNewCard();
            }
          }
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
    currentPopup?: any;
    currentModal?: any;
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

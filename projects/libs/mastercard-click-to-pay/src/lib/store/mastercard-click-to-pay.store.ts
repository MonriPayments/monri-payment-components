import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
  StateSignal
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { withRequestStatus, setPending } from './request-status.feature';
import { StartPaymentRequest } from '../interfaces/alternative-payment-method.interface';
import { MastercardClickToPayService } from '../services/mastercard-click-to-pay.service';
import { Prettify } from '@ngrx/signals/src/ts-helpers';
import {
  MethodsDictionary,
  SignalsDictionary,
  SignalStoreSlices
} from '@ngrx/signals/src/signal-store-models';
import {
  MastercardInitRequest,
  MastercardInitResponse,
  MaskedCard,
  AuthenticateRequest,
  AuthenticateResponse,
  EncryptCardRequest,
  EncryptCardResponse,
  CheckoutWithNewCardRequest,
  CheckoutWithNewCardResponse,
  SignOutRequest,
  SignOutResponse,
  Consumer,
  ConsumerIdentity,
  WindowRef,
  MastercardCheckoutService,
  MastercardCheckoutServices,
  CheckoutWithCardRequest,
  CheckoutWithCardResponse,
  DpaData,
  DpaTransactionOptions
} from '../interfaces/mastercard-click-to-pay.interface';

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
    availableServices: [] as Array<string>,
    maskedCards: [] as MaskedCard[],
    encryptedCard: '',
    cardBrand: '',
    selectedCardId: '' as string,
    rememberMe: true as boolean,
    recognitionTokenRequested: true as boolean,
    srcDpaId: '' as string,
    dpaData: {} as DpaData,
    dpaTransactionOptions: {} as DpaTransactionOptions,
    cardBrands: [] as Array<string>
  }),
  withRequestStatus(),
  withComputed(store => ({
    locale: computed(() => store.inputParams().data['locale']),
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
    ),
    orderedAvailableCardBrands: computed(() => {
      const available = store.availableCardBrands();
      const predefinedOrder = store.cardBrands();

      return predefinedOrder.filter(brand => available.includes(brand));
    }),
    orderedAvailableCardBrandsWithMapping: computed(() => {
      const available = store.availableCardBrands();
      const predefinedOrder = store.cardBrands();

      const filtered = predefinedOrder.filter(brand =>
        available.includes(brand)
      );
      return filtered.map(brand =>
        brand === 'amex' ? 'american-express' : brand
      );
    })
  })),
  withMethods(
    (store, mastercardService = inject(MastercardClickToPayService)) => {
      const getScriptDomain = () =>
        store.environment() === 'production'
          ? 'https://src.mastercard.com'
          : 'https://sandbox.src.mastercard.com';

      const loadScript = (src: string, type?: string) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          if (type) script.type = type;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      };

      const loadStylesheet = (href: string) => {
        return new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.href = href;
          link.rel = 'stylesheet';
          link.onload = resolve;
          link.onerror = reject;
          document.head.appendChild(link);
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
          const initData: MastercardInitRequest = {
            srcDpaId: store.srcDpaId(),
            dpaData: store.dpaData(),
            dpaTransactionOptions: store.dpaTransactionOptions(),
            cardBrands: store.cardBrands()
          };

          const result: MastercardInitResponse = await mcCheckoutService.init(
            initData
          );
          window.mcCheckoutServices = mcCheckoutService;
          patchState(store, {
            availableCardBrands: result.availableCardBrands,
            availableServices: result.availableServices
          });

          console.log('Mastercard Click to Pay init successful', result);
        } catch (error) {
          console.error('Mastercard Click to Pay init() failed:', error);
        }
      };

      const getCards = async () => {
        if (!window.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
        }

        try {
          const cardsResponse: MaskedCard[] =
            await window.mcCheckoutServices.getCards();
          patchState(store, { maskedCards: cardsResponse });
          console.log('getCards response:', cardsResponse);
        } catch (error) {
          console.error('getCards failed:', error);
        }
      };

      const authenticate = async (
        createModal: () => Window | null,
        closeModal: () => void
      ) => {
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
          let consumerIdentity: ConsumerIdentity;

          const modal = createModal();

          if (phone) {
            consumerIdentity = {
              identityType: 'MOBILE_PHONE_NUMBER',
              identityValue: phone
            };
          } else if (email) {
            consumerIdentity = {
              identityType: 'EMAIL_ADDRESS',
              identityValue: email
            };
          } else {
            throw new Error(
              'Either phone number or email address must be provided'
            );
          }

          const authenticateData: AuthenticateRequest = {
            windowRef: modal as WindowRef,
            accountReference: {
              consumerIdentity
            },
            requestRecognitionToken: true
          };

          const authenticateResponse: AuthenticateResponse =
            await window.mcCheckoutServices.authenticate(authenticateData);
          patchState(store, { maskedCards: authenticateResponse.cards || [] });
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
          const encryptCardResponse: EncryptCardResponse =
            await window.mcCheckoutServices.encryptCard(
              store.encryptCardParams() as EncryptCardRequest
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

      const checkoutWithNewCard = async (
        createModal: () => Window | null,
        closeModal: () => void
      ) => {
        if (!window.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return;
        }

        try {
          const consumer = store.inputParams().data['consumer'];

          const modal = createModal();

          const checkoutWithNewCardData: CheckoutWithNewCardRequest = {
            windowRef: modal as WindowRef,
            encryptedCard: store.encryptedCard(),
            cardBrand: store.cardBrand(),
            rememberMe: store.rememberMe(),
            recognitionTokenRequested: store.recognitionTokenRequested()
          };

          // Add consumer data if available
          if (consumer) {
            checkoutWithNewCardData.consumer = {
              emailAddress: consumer.email,
              mobileNumber: consumer.mobileNumber,
              firstName: consumer.firstName,
              lastName: consumer.lastName
            } as Consumer;
          }

          console.log(checkoutWithNewCardData);

          const checkoutWithNewCardResponse: CheckoutWithNewCardResponse =
            await window.mcCheckoutServices.checkoutWithNewCard(
              checkoutWithNewCardData
            );

          patchState(store, {
            maskedCards: checkoutWithNewCardResponse.checkoutResponseData
              ?.maskedCard
              ? [checkoutWithNewCardResponse.checkoutResponseData.maskedCard]
              : []
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

      const checkoutWithCard = async (
        createModal: () => Window | null,
        closeModal: () => void
      ) => {
        if (!window.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return;
        }

        try {
          const modal = createModal();

          const checkoutWithCardData: CheckoutWithCardRequest = {
            srcDigitalCardId: store.selectedCardId(),
            windowRef: modal as WindowRef
          };

          console.log(checkoutWithCardData);

          const checkoutWithCardResponse: CheckoutWithCardResponse =
            await window.mcCheckoutServices.checkoutWithCard(
              checkoutWithCardData
            );

          console.log('checkoutWithCard response:', checkoutWithCardResponse);
        } catch (error) {
          console.error('checkoutWithCard failed:', error);
          closeModal();
        }
      };

      const waitForCardSelection = (): Promise<void> => {
        return new Promise(resolve => {
          if (store.selectedCardId()) {
            resolve();
            return;
          }

          const checkSelection = () => {
            if (store.selectedCardId()) {
              resolve();
            } else {
              setTimeout(checkSelection, 100);
            }
          };

          checkSelection();
        });
      };

      const signOut = async (
        recognitionToken?: string
      ): Promise<SignOutResponse | undefined> => {
        if (!window.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return undefined;
        }

        try {
          const signOutData: SignOutRequest = {};
          if (recognitionToken) {
            signOutData.recognitionToken = recognitionToken;
          }

          const signOutResponse: SignOutResponse =
            await window.mcCheckoutServices.signOut(signOutData);

          patchState(store, { maskedCards: signOutResponse.cards || [] });
          console.log('signOut response:', signOutResponse);

          return signOutResponse;
        } catch (error) {
          console.error('signOut failed:', error);
          return undefined;
        }
      };

      const onLoad = async (
        createModal: () => Window | null,
        closeModal: () => void
      ) => {
        try {
          const [mastercardScript, uiStyle, uiScript] = [
            loadMastercardScript(),
            loadMastercardUIStyle(),
            loadMastercardUIScript()
          ];

          await mastercardScript;
          await initClickToPay();
          await Promise.all([uiStyle, uiScript]);

          console.log('ROUND1');
          await getCards();
          console.log('ROUND2');

          if (store.maskedCards().length === 0) {
            console.log('ROUND3');
            await authenticate(createModal, closeModal);
            console.log('ROUND4');

            if (store.maskedCards().length === 0) {
              console.log('ROUND5');
              await encryptCard();
              console.log('ROUND6');
              await checkoutWithNewCard(createModal, closeModal);
              console.log('ROUND7');
            }
          } else {
            console.log('ROUND3-2');
            // Wait for user to select a card
            await waitForCardSelection();
            await checkoutWithCard(createModal, closeModal);
            console.log('ROUND4-2');
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
        setWindowServices,
        getCards,
        authenticate,
        encryptCard,
        checkoutWithNewCard,
        signOut
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
    currentModal?: HTMLElement;
    mcCheckoutServices: MastercardCheckoutService;
    MastercardCheckoutServices?: MastercardCheckoutServices;
    MastercardClickToPaySession?: unknown;
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

import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { withRequestStatus, setPending } from './request-status.feature';
import { StartPaymentRequest } from '../interfaces/alternative-payment-method.interface';
import { MastercardClickToPayService } from '../services/mastercard-click-to-pay.service';
import { CardDataStore } from './card-data.store';
import {
  loadMastercardScript,
  loadMastercardUIStyle,
  loadMastercardUIScript
} from '../helpers/script-loader.helpers';
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
  DpaTransactionOptions,
  PhoneNumber
} from '../interfaces/mastercard-click-to-pay.interface';

export const MastercardClickToPayStore = signalStore(
  withState({
    inputParams: {
      payment_method: '',
      data: {}
    } as StartPaymentRequest,
    resolution: window.innerWidth,
    environment: '',
    availableCardBrands: [] as Array<string>,
    availableServices: [] as Array<string>,
    maskedCards: [] as MaskedCard[],
    selectedCardId: '' as string,
    rememberMe: true as boolean,
    recognitionTokenRequested: true as boolean,
    srcDpaId: '',
    dpaData: {} as DpaData,
    dpaTransactionOptions: {} as DpaTransactionOptions,
    cardBrands: [] as Array<string>
  }),
  withRequestStatus(),
  withComputed(store => ({
    locale: computed(() => store.inputParams().data['locale']),
    darkTheme: computed(() => store.inputParams().data['darkTheme'] || false),
    email: computed(() => store.inputParams().data['ch_email']),
    phone: computed(() => store.inputParams().data['ch_phone']),
    consumer: computed(() => {
      const data = store.inputParams().data;
      const consumer: Partial<Consumer> = {};

      if (data['ch_email']) consumer.emailAddress = data['ch_email'] as string;
      if (data['mobileNumber'])
        consumer.mobileNumber = data['mobileNumber'] as PhoneNumber;
      if (data['firstName']) consumer.firstName = data['firstName'] as string;
      if (data['lastName']) consumer.lastName = data['lastName'] as string;

      return Object.keys(consumer).length > 0 ? consumer : null;
    }),
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
    (
      store,
      mastercardService = inject(MastercardClickToPayService),
      cardStore = inject(CardDataStore)
    ) => {
      const initClickToPay = async () => {
        const globalWindow = window as unknown as MastercardGlobal;
        const MastercardCheckoutServices = globalWindow.MastercardCheckoutServices;
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
          (window as unknown as MastercardGlobal).mcCheckoutServices =
            mcCheckoutService;
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
        const globalWindow = window as unknown as MastercardGlobal;
        if (!globalWindow.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
        }

        try {
          const cardsResponse: MaskedCard[] =
            await globalWindow.mcCheckoutServices!.getCards();
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
        const globalWindow = window as unknown as MastercardGlobal;
        if (!globalWindow.mcCheckoutServices) {
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
            await globalWindow.mcCheckoutServices!.authenticate(
              authenticateData
            );
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
        const globalWindow = window as unknown as MastercardGlobal;
        if (!globalWindow.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return;
        }

        if (!cardStore.canEncrypt()) {
          console.error('Card data not ready for encryption');
          return;
        }

        try {
          const encryptCardResponse: EncryptCardResponse =
            await globalWindow.mcCheckoutServices!.encryptCard(
              cardStore.cardData() as EncryptCardRequest
            );
          cardStore.setEncryptedCard(
            encryptCardResponse.encryptedCard,
            encryptCardResponse.cardBrand
          );
          console.log('encryptCard response:', encryptCardResponse);
        } catch (error) {
          console.error('encryptCard failed:', error);
        }
      };

      const checkoutWithNewCard = async (
        createModal: () => Window | null,
        closeModal: () => void
      ) => {
        const globalWindow = window as unknown as MastercardGlobal;
        if (!globalWindow.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return;
        }

        try {
          const consumer = store.consumer();

          const modal = createModal();

          if (!cardStore.canCheckout()) {
            console.error('Card not ready for checkout');
            closeModal();
            return;
          }

          const checkoutWithNewCardData: CheckoutWithNewCardRequest = {
            windowRef: modal as WindowRef,
            encryptedCard: cardStore.encryptedCard(),
            cardBrand: cardStore.cardBrand(),
            rememberMe: store.rememberMe(),
            recognitionTokenRequested: store.recognitionTokenRequested()
          };

          // Add consumer data if available
          if (consumer) {
            checkoutWithNewCardData.consumer = consumer as Consumer;
          }

          console.log(checkoutWithNewCardData);

          const checkoutWithNewCardResponse: CheckoutWithNewCardResponse =
            await globalWindow.mcCheckoutServices!.checkoutWithNewCard(
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
        const globalWindow = window as unknown as MastercardGlobal;
        if (!globalWindow.mcCheckoutServices) {
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
            await globalWindow.mcCheckoutServices!.checkoutWithCard(
              checkoutWithCardData
            );

          console.log('checkoutWithCard response:', checkoutWithCardResponse);
        } catch (error) {
          console.error('checkoutWithCard failed:', error);
          closeModal();
        }
      };

      const signOut = async (
        recognitionToken?: string
      ): Promise<SignOutResponse | undefined> => {
        const globalWindow = window as unknown as MastercardGlobal;
        if (!globalWindow.mcCheckoutServices) {
          console.error('Mastercard Click to Pay not initialized');
          return undefined;
        }

        try {
          const signOutData: SignOutRequest = {};
          if (recognitionToken) {
            signOutData.recognitionToken = recognitionToken;
          }

          const signOutResponse: SignOutResponse =
            await globalWindow.mcCheckoutServices.signOut(signOutData);

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
          // Load scripts in parallel for better performance
          const [mastercardScript, uiStyle, uiScript] =
            await Promise.allSettled([
              loadMastercardScript(
                store.environment(),
                store.srcDpaId(),
                store.locale()
              ),
              loadMastercardUIStyle(),
              loadMastercardUIScript()
            ]);

          // Check if critical script loading failed
          if (mastercardScript.status === 'rejected') {
            throw new Error(
              `Failed to load Mastercard script: ${mastercardScript.reason}`
            );
          }

          await initClickToPay();

          // Check if UI scripts failed (non-critical)
          if (uiStyle.status === 'rejected') {
            console.warn('Failed to load UI style:', uiStyle.reason);
          }
          if (uiScript.status === 'rejected') {
            console.warn('Failed to load UI script:', uiScript.reason);
          }

          await getCards();

          if (store.maskedCards().length === 0) {
            try {
              await authenticate(createModal, closeModal);
            } catch (authError) {
              console.warn('Authentication failed:', authError);
              // Continue to fallback flow
            }

            if (store.maskedCards().length === 0) {
              console.log(
                'No cards found. Waiting for external card data input...'
              );
            }
          } else {
            console.log(
              'Cards found. Waiting for card selection and payment trigger...'
            );
          }
        } catch (err) {
          console.error('Critical error loading Mastercard Click to Pay:', err);
          // Could emit error event here for external handling
          throw err; // Re-throw to let component handle
        }
      };

      const setWindowServices = () => {
        const globalWindow = window as unknown as MastercardGlobal;
        globalWindow.mastercardClickToPayStore = store as unknown;
        globalWindow.mastercardClickToPayService = mastercardService as unknown;
      };

      const triggerCheckoutWithCard = async (
        createModal: () => Window | null,
        closeModal: () => void
      ) => {
        if (!store.selectedCardId()) {
          console.error('No card selected for checkout');
          return;
        }

        await checkoutWithCard(createModal, closeModal);
      };

      return {
        onLoad,
        setWindowServices,
        getCards,
        authenticate,
        encryptCard,
        checkoutWithNewCard,
        signOut,
        triggerCheckoutWithCard,
        getCardStore: () => cardStore
      };
    }
  ),
  withHooks({
    onInit(store) {
      patchState(store, setPending());
      store['setWindowServices']();
    }
  })
);

// Local interface for Mastercard window properties
interface MastercardGlobal {
  currentModal?: HTMLElement;
  mcCheckoutServices?: MastercardCheckoutService;
  MastercardCheckoutServices?: MastercardCheckoutServices;
  MastercardClickToPaySession?: unknown;
  mastercardClickToPayService?: unknown;
  mastercardClickToPayStore?: unknown;
  mastercardClickToPayComponent?: unknown;
}

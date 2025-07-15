import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { withRequestStatus, setPending } from './request-status.feature';
import { StartPaymentRequest } from '../interfaces/alternative-payment-method.interface';
import { MastercardC2pService } from '../services/mastercard-c2p.service';
import { CardDataStore } from './card-data.store';
import { loadMastercardScript } from '../helpers/script-loader.helpers';
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
} from '../interfaces/mastercard-c2p.interface';

export const MastercardC2pStore = signalStore(
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
    cardBrands: [] as Array<string>,
    authenticationComplete: false as boolean,
    isLoadingCards: false as boolean,
    paymentInitiated: false as boolean
  }),
  withRequestStatus(),
  withComputed(store => ({
    locale: computed(() => store.inputParams().data['locale']),
    language: computed(() => store.inputParams().data['language']),
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

      // If we have authentication results, filter by available brands
      if (available.length > 0) {
        const filtered = predefinedOrder.filter(brand =>
          available.includes(brand)
        );
        return filtered.map(brand =>
          brand === 'amex' ? 'american-express' : brand
        );
      }

      // Before authentication, use all configured card brands
      return predefinedOrder.map(brand =>
        brand === 'amex' ? 'american-express' : brand
      );
    }),
    // SRC Button expects 'amex' instead of 'american-express'
    orderedCardBrandsForButton: computed(() => {
      const available = store.availableCardBrands();
      const predefinedOrder = store.cardBrands();

      let brandsToUse = predefinedOrder;

      // If we have authentication results, filter by available brands
      if (available.length > 0) {
        brandsToUse = predefinedOrder.filter(brand =>
          available.includes(brand)
        );
      }

      // SRC Button uses 'amex' not 'american-express'
      return brandsToUse; // Keep original naming including 'amex'
    })
  })),
  withMethods(
    (
      store,
      mastercardService = inject(MastercardC2pService),
      cardStore = inject(CardDataStore)
    ) => {
      const initC2p = async () => {
        const globalWindow = window as unknown as MastercardGlobal;
        const MastercardCheckoutServices =
          globalWindow.MastercardCheckoutServices;
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

          console.log('Mastercard C2P init successful', result);
        } catch (error) {
          console.error('Mastercard C2P init() failed:', error);
        }
      };

      const getCards = async () => {
        const globalWindow = window as unknown as MastercardGlobal;
        if (!globalWindow.mcCheckoutServices) {
          console.error('Mastercard C2P not initialized');
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
          console.error('Mastercard C2P not initialized');
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
          console.error('Mastercard C2P not initialized');
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
          console.error('Mastercard C2P not initialized');
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

          // Create transaction after successful checkout
          await createTransaction(checkoutWithNewCardResponse, 'NEW_CARD');

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
          console.error('Mastercard C2P not initialized');
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

          // Create transaction after successful checkout
          await createTransaction(checkoutWithCardResponse, 'EXISTING_CARD');
        } catch (error) {
          console.error('checkoutWithCard failed:', error);
          closeModal();
        }
      };

      const createTransaction = async (
        checkoutResponse:
          | CheckoutWithNewCardResponse
          | CheckoutWithCardResponse,
        checkoutType: 'NEW_CARD' | 'EXISTING_CARD'
      ) => {
        try {
          const inputParams = store.inputParams();

          // Build payment_method_data from checkout response
          const paymentMethodData = {
            /*dpaTransactionOptions: {
              transactionAmount: {
                transactionAmount: inputParams.amount?.toString() || inputParams.data.amount?.toString() || "0.0",
                transactionCurrencyCode: inputParams.currency || inputParams.data.currency || "USD"
              }
            },*/
            srcDpaId: store.srcDpaId(),
            correlationId:
              checkoutResponse.checkoutResponseData?.srcCorrelationId || '',
            checkoutType: 'CLICK_TO_PAY',
            checkoutReference: {
              type: 'MERCHANT_TRANSACTION_ID',
              data: {
                merchantTransactionId:
                  checkoutResponse.headers?.['merchant-transaction-id'] || ''
              }
            }
          };

          // Build transaction request
          const transactionRequest = {
            transaction: {
              trx_token: inputParams.trx_token || '',
              language: store.language(),
              ch_full_name:
                inputParams.data.ch_full_name ||
                `${inputParams.data.firstName || ''} ${
                  inputParams.data.lastName || ''
                }`.trim(),
              ch_address: inputParams.data.ch_address || '',
              ch_city: inputParams.data.ch_city || '',
              ch_zip: inputParams.data.ch_zip || '',
              ch_country: inputParams.data.ch_country || '',
              ch_phone: inputParams.data.ch_phone || '',
              ch_email: inputParams.data.ch_email || '',
              meta: {
                checkoutType,
                mastercardResponse: checkoutResponse
              },
              payment_method_type: 'mastercard-c2p',
              payment_method_data: paymentMethodData
            }
          };

          console.log('Creating transaction:', transactionRequest);

          const result = await firstValueFrom(
            mastercardService.newTransaction(
              transactionRequest,
              store.environment()
            )
          );

          console.log('Transaction created successfully:', result);

          return result;
        } catch (error) {
          console.error('Transaction creation failed:', error);

          throw error;
        }
      };

      const signOut = async (
        recognitionToken?: string
      ): Promise<SignOutResponse | undefined> => {
        const globalWindow = window as unknown as MastercardGlobal;
        if (!globalWindow.mcCheckoutServices) {
          console.error('Mastercard C2P not initialized');
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

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SET_INPUT') {
          console.log('Received SET_INPUT message:', event.data);

          const inputParams = event.data.payload.inputParams;

          patchState(store, {
            inputParams: inputParams,
            environment: inputParams.data.environment || '',
            srcDpaId: inputParams.data.srcDpaId || '',
            dpaData: inputParams.data.dpaData || {},
            dpaTransactionOptions: inputParams.data.dpaTransactionOptions || {},
            cardBrands: inputParams.data.cardBrands || []
          });

          onLoad(
            () => {
              const modal = window.open('', '_blank', 'width=400,height=600');
              return modal;
            },
            () => {
              const windowWithModal = window as { currentModal?: HTMLElement };
              if (windowWithModal.currentModal) {
                windowWithModal.currentModal.remove();
                windowWithModal.currentModal = undefined;
              }
            }
          );
        }
      };

      const onLoad = async (
        createModal: () => Window | null,
        closeModal: () => void
      ) => {
        try {
          patchState(store, { isLoadingCards: true });

          // Load only the main Mastercard script (UI scripts already loaded in component)
          await loadMastercardScript(
            store.environment(),
            store.srcDpaId(),
            store.locale()
          );

          await initC2p();

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
                'No cards found after authentication. Showing consent for new card...'
              );
              // The component will automatically show consent when maskedCards is empty
            }
            patchState(store, {
              authenticationComplete: true,
              isLoadingCards: false
            });
          } else {
            console.log(
              'Cards found. Waiting for card selection and payment trigger...'
            );
            patchState(store, {
              authenticationComplete: true,
              isLoadingCards: false
            });
          }
        } catch (err) {
          console.error('Critical error loading Mastercard C2P:', err);
          patchState(store, { isLoadingCards: false });
          // Could emit error event here for external handling
          throw err; // Re-throw to let component handle
        }
      };

      const setWindowServices = () => {
        const globalWindow = window as unknown as MastercardGlobal;
        globalWindow.mastercardC2pStore = store as unknown;
        globalWindow.mastercardC2pService = mastercardService as unknown;
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
        handleMessage,
        getCardStore: () => cardStore
      };
    }
  ),
  withHooks({
    onInit(store) {
      patchState(store, setPending());
      store['setWindowServices']();

      window.addEventListener('message', store.handleMessage.bind(this));
    }
  })
);

// Local interface for Mastercard window properties
interface MastercardGlobal {
  currentModal?: HTMLElement;
  mcCheckoutServices?: MastercardCheckoutService;
  MastercardCheckoutServices?: MastercardCheckoutServices;
  MastercardC2pSession?: unknown;
  mastercardC2pService?: unknown;
  mastercardC2pStore?: unknown;
  mastercardC2pComponent?: unknown;
}

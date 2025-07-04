import { Injectable } from '@angular/core';
import { MastercardEventsService } from './mastercard-events.service';
import { MESSAGE_TYPES, MessageType } from '../constants/message-types';

// Define minimal interfaces for stores to avoid circular dependencies
interface MastercardStore {
  encryptCard(): void;
  checkoutWithNewCard(createModal: () => Window | null, closeModal: () => void): void;
  triggerCheckoutWithCard(createModal: () => Window | null, closeModal: () => void): void;
  isFulfilled(): boolean;
  maskedCards(): unknown[];
}

interface CardStore {
  setCardData(data: unknown): void;
  clearCardData(): void;
  canEncrypt(): boolean;
  canCheckout(): boolean;
  isCardDataReady(): boolean;
  hasCardData(): boolean;
  isCardEncrypted(): boolean;
}

export interface MessageHandlerContext {
  cardStore: CardStore;
  store: MastercardStore;
  createModal: () => Window | null;
  closeModal: () => void;
}

export interface WindowMessageData {
  type: string;
  requestId?: string;
  cardData?: unknown;
  [key: string]: unknown;
}

export interface ResponseFunction {
  (success: boolean, data?: unknown, error?: string): void;
}

@Injectable({
  providedIn: 'root'
})
export class MastercardMessageHandlerService {
  private messageHandler?: (event: MessageEvent) => void;
  
  constructor(private eventsService: MastercardEventsService) {}

  setupMessageHandlers(context: MessageHandlerContext): void {
    // Remove existing handler if it exists
    this.cleanup();
    
    this.messageHandler = (event: MessageEvent<WindowMessageData>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      // Filter out non-Mastercard messages
      if (!event.data || 
          typeof event.data !== 'object' || 
          !event.data.type || 
          typeof event.data.type !== 'string') {
        return;
      }

      // Only handle specific Mastercard message types
      const validMessageTypes = Object.values(MESSAGE_TYPES);

      if (!validMessageTypes.includes(event.data.type as MessageType)) {
        return;
      }

      const respond: ResponseFunction = (success: boolean, data?: unknown, error?: string) => {
        if (event.data.requestId) {
          this.eventsService.emitResponse(event.data.requestId, success, data, error);
        }
      };

      this.handleMessage(event.data, respond, context);
    };

    window.addEventListener('message', this.messageHandler);

    this.eventsService.emitComponentReady();
    this.exposeWindowAPI(context);
  }

  cleanup(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = undefined;
    }
  }

  private handleMessage(
    messageData: WindowMessageData,
    respond: ResponseFunction,
    context: MessageHandlerContext
  ): void {
    const { cardStore, store, createModal, closeModal } = context;

    switch (messageData.type) {
      case MESSAGE_TYPES.SET_CARD_DATA:
        this.handleSetCardData(messageData, respond, cardStore);
        break;

      case MESSAGE_TYPES.CLEAR_CARD_DATA:
        this.handleClearCardData(respond, cardStore);
        break;

      case MESSAGE_TYPES.TRIGGER_ENCRYPT_CARD:
        this.handleEncryptCard(respond, cardStore, store);
        break;

      case MESSAGE_TYPES.TRIGGER_CHECKOUT_NEW_CARD:
        this.handleCheckoutNewCard(respond, cardStore, store, createModal, closeModal);
        break;

      case MESSAGE_TYPES.TRIGGER_CHECKOUT_WITH_CARD:
        this.handleCheckoutWithCard(respond, store, createModal, closeModal);
        break;

      case MESSAGE_TYPES.GET_COMPONENT_STATE:
        this.handleGetComponentState(respond, cardStore, store);
        break;

      case MESSAGE_TYPES.MASTERCARD_MASKED_CARDS_CHANGED:
      case MESSAGE_TYPES.MASTERCARD_COMPONENT_READY:
      case MESSAGE_TYPES.MASTERCARD_RESPONSE:
        // These are outgoing events, ignore them when received
        break;

      default:
        console.warn('Unknown message type:', messageData.type);
    }
  }

  private handleSetCardData(messageData: WindowMessageData, respond: ResponseFunction, cardStore: CardStore): void {
    if (messageData.cardData) {
      cardStore.setCardData(messageData.cardData);
      console.log('Card data received via window message:', messageData.cardData);
      respond(true, { cardDataSet: true });
    } else {
      respond(false, null, 'No card data provided');
    }
  }

  private handleClearCardData(respond: ResponseFunction, cardStore: CardStore): void {
    cardStore.clearCardData();
    console.log('Card data cleared via window message');
    respond(true, { cardDataCleared: true });
  }

  private handleEncryptCard(respond: ResponseFunction, cardStore: CardStore, store: MastercardStore): void {
    if (cardStore.canEncrypt()) {
      store.encryptCard();
      respond(true, { encryptionTriggered: true });
    } else {
      console.warn('Cannot encrypt card - card data not ready');
      respond(false, null, 'Cannot encrypt card - card data not ready');
    }
  }

  private handleCheckoutNewCard(
    respond: ResponseFunction,
    cardStore: CardStore,
    store: MastercardStore,
    createModal: () => Window | null,
    closeModal: () => void
  ): void {
    if (cardStore.canCheckout()) {
      store.checkoutWithNewCard(createModal, closeModal);
      respond(true, { checkoutTriggered: true });
    } else {
      console.warn('Cannot checkout with new card - card not encrypted');
      respond(false, null, 'Cannot checkout with new card - card not encrypted');
    }
  }

  private handleCheckoutWithCard(
    respond: ResponseFunction,
    store: MastercardStore,
    createModal: () => Window | null,
    closeModal: () => void
  ): void {
    store.triggerCheckoutWithCard(createModal, closeModal);
    respond(true, { checkoutWithCardTriggered: true });
  }

  private handleGetComponentState(respond: ResponseFunction, cardStore: CardStore, store: MastercardStore): void {
    respond(true, {
      cardStore: {
        isCardDataReady: cardStore.isCardDataReady(),
        hasCardData: cardStore.hasCardData(),
        canEncrypt: cardStore.canEncrypt(),
        canCheckout: cardStore.canCheckout(),
        isCardEncrypted: cardStore.isCardEncrypted()
      },
      mainStore: {
        isFulfilled: store.isFulfilled(),
        maskedCardsCount: store.maskedCards().length
      }
    });
  }

  private exposeWindowAPI(context: MessageHandlerContext): void {
    (window as unknown as { mastercardClickToPayComponent: unknown }).mastercardClickToPayComponent = {
      // Promise-based methods for external integrations
      setCardData: (cardData: unknown) =>
        this.eventsService.sendMessageWithPromise('SET_CARD_DATA', { cardData }),
      clearCardData: () => this.eventsService.sendMessageWithPromise('CLEAR_CARD_DATA'),
      encryptCard: () => this.eventsService.sendMessageWithPromise('TRIGGER_ENCRYPT_CARD'),
      checkoutWithNewCard: () =>
        this.eventsService.sendMessageWithPromise('TRIGGER_CHECKOUT_NEW_CARD'),
      checkoutWithCard: () =>
        this.eventsService.sendMessageWithPromise('TRIGGER_CHECKOUT_WITH_CARD'),
      getComponentState: () =>
        this.eventsService.sendMessageWithPromise('GET_COMPONENT_STATE'),
      // Debug methods
      getCardStore: () => context.cardStore,
      getStore: () => context.store
    };
  }
}
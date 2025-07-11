import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { EncryptCardRequest } from '../interfaces/mastercard-c2p.interface';

export interface CardDataMessage {
  type: 'SET_CARD_DATA' | 'CLEAR_CARD_DATA' | 'TRIGGER_ENCRYPT_CARD' | 'TRIGGER_CHECKOUT_NEW_CARD' | 'TRIGGER_CHECKOUT_WITH_CARD';
  cardData?: EncryptCardRequest;
}

export const CardDataStore = signalStore(
  withState({
    cardData: null as EncryptCardRequest | null,
    isCardDataReady: false,
    encryptedCard: '',
    cardBrand: '',
    isCardEncrypted: false
  }),
  withComputed(store => ({
    hasCardData: computed(() => store.cardData() !== null),
    canEncrypt: computed(() => 
      store.isCardDataReady() && !store.isCardEncrypted()
    ),
    canCheckout: computed(() => 
      store.isCardEncrypted() && 
      store.encryptedCard().length > 0 && 
      store.cardBrand().length > 0
    )
  })),
  withMethods(store => ({
    setCardData: (cardData: EncryptCardRequest) => {
      patchState(store, {
        cardData,
        isCardDataReady: true,
        // Reset encryption state when new card data is provided
        encryptedCard: '',
        cardBrand: '',
        isCardEncrypted: false
      });
    },
    
    setEncryptedCard: (encryptedCard: string, cardBrand: string) => {
      patchState(store, {
        encryptedCard,
        cardBrand,
        isCardEncrypted: true
      });
    },
    
    clearCardData: () => {
      patchState(store, {
        cardData: null,
        isCardDataReady: false,
        encryptedCard: '',
        cardBrand: '',
        isCardEncrypted: false
      });
    },
    
    resetEncryption: () => {
      patchState(store, {
        encryptedCard: '',
        cardBrand: '',
        isCardEncrypted: false
      });
    }
  }))
);
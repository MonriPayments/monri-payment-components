import {
  patchState,
  signalStore,
  StateSignal,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { setPending, withRequestStatus } from './request-status.feature';
import { KeksPayService } from '../services/keks-pay.service';
import { TranslationService } from '../services/translation.service';
import { Prettify } from '@ngrx/signals/src/ts-helpers';
import {
  MethodsDictionary,
  SignalsDictionary,
  SignalStoreSlices
} from '@ngrx/signals/src/signal-store-models';
import {StartPaymentRequest} from "../interfaces/alternative-payment-method.interface";

export const KeksPayStore = signalStore(
  withState({
    bill_id: '',
    cid: '',
    tid: '',
    amount: '',
    environment: '',
    inputParams: {
      payment_method: '',
      data: {}
    } as StartPaymentRequest,
    resolution: window.innerWidth
  }),
  withRequestStatus(),
  withComputed(store => ({
    url: computed(
      () =>
        'https://kekspay.hr/' +
        store.environment() +
        '?' +
        '&cid=' +
        store.cid() +
        '&tid=' +
        store.tid() +
        '&bill_id=' +
        store.bill_id() +
        '&amount=' +
        store.amount()
    ),
    isMobileView: computed(() => store.resolution() <= 768),
    isLoading: computed(() => store.isPending())
  })),
  withMethods(
    (
      store,
      keksPayService = inject(KeksPayService),
      translationService = inject(TranslationService)
    ) => ({
      setWindowServices() {
        window.keksPayStore = store;
        window.keksPayService = keksPayService;
        window.translationService = translationService;
      },
      mobileViewRedirect() {
        window.open(store.url(), '_blank');
      }
    })
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
    keksPayService: KeksPayService;
    translationService: TranslationService;
    keksPayStore: Prettify<SignalStoreSlices<object> & SignalsDictionary & MethodsDictionary & StateSignal<object>> | unknown;
  }
}

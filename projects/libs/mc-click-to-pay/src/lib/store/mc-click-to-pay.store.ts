import {
  patchState,
  signalStore,
  StateSignal,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import {computed, inject} from '@angular/core';
import {setPending, withRequestStatus} from './request-status.feature';
import {MastercardClickToPayService} from '../services/mc-click-to-pay.service';
import {MCTranslationService} from '../services/translation.service';
import {Prettify} from '@ngrx/signals/src/ts-helpers';
import {
  MethodsDictionary,
  SignalsDictionary,
  SignalStoreSlices
} from '@ngrx/signals/src/signal-store-models';
import { StartPaymentRequest } from '../interfaces/alternative-payment-method.interface';

export const MastercardClickToPayStore = signalStore(
  withState({
    qr_type: '1',
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
    url: computed(() => {
      if (store.inputParams().is_test) {
        return 'https://monri.com';
      }

      return (
        'https://kekspay.hr/' +
        store.environment() +
        '?' +
        '&qr_type=' +
        store.qr_type() +
        '&cid=' +
        store.cid() +
        '&tid=' +
        store.tid() +
        '&bill_id=' +
        store.bill_id() +
        '&amount=' +
        store.amount()
      );
    }),
    isMobileView: computed(() => store.resolution() <= 768),
    isLoading: computed(() => store.isPending())
  })),
  withMethods(
    (
      store,
      mastercardClickToPayService = inject(MastercardClickToPayService),
      mctranslationService = inject(MCTranslationService)
    ) => ({
      setWindowServices() {
        window.mastercardClickToPayStore = store;
        window.mastercardClickToPayService = mastercardClickToPayService;
        window.mctranslationService = mctranslationService;
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
    mastercardClickToPayService: MastercardClickToPayService;
    mctranslationService: MCTranslationService;
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

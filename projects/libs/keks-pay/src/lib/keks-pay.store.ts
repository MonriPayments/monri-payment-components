import {
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { CustomEventService } from './services/custom-event.service';

export const KeksPayStore = signalStore(
  withState({
    billid: '',
    cid: '',
    tid: '',
    store: '',
    amount: 0
  }),
  withComputed(({ billid, cid, tid, store, amount }) => ({
    redirectUrl: computed(() => {
      return (
        'https://kekspay.hr/pay?cid=' +
        cid() +
        '&tid=' +
        tid() +
        '&store=' +
        store() +
        '&bill_id=' +
        billid() +
        '&amount=' +
        amount()
      );
    })
  })),
  withMethods((store, customEventService = inject(CustomEventService)) => ({
    notifyOnLoad(): void {
      customEventService.dispatchEvent('onComponentLoad', 'Component loaded');
    }
  })),
  withHooks({
    onInit(store) {
      store.notifyOnLoad();
    }
  })
);

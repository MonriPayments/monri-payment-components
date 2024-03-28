import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { KeksPayService } from './services/keks-pay.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { delay, filter, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { KeksPayResModel } from './models/keks-pay.res.model';
import {
  setError,
  setFulfilled,
  setPending,
  withRequestStatus
} from './shared/request-status.feature';

export const KeksPayStore = signalStore(
  withState({
    billid: '',
    keksid: '',
    tid: '',
    store: '',
    amount: 0,
    status: 0,
    message: ''
  }),
  withRequestStatus(),
  withComputed(({ status, isPending }) => {
    return {
      showSpinner: computed(() => isPending() && status() === 0)
    };
  }),
  withMethods((store, keksPayService = inject(KeksPayService)) => ({
    authorizeTransaction: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() => {
          return keksPayService.authorizeTransaction().pipe(
            delay(2000),
            tapResponse({
              next: (transactionResponse: KeksPayResModel) => {
                patchState(
                  store,
                  { status: transactionResponse.status },
                  setFulfilled()
                );
              },
              error: (error: { message: string }) => {
                patchState(store, setError(error.message));
              }
            })
          );
        })
      )
    ),
    notifyOnError: rxMethod<string | null>(
      pipe(
        filter(Boolean),
        tap(error => console.error(error))
      )
    )
  })),
  withHooks({
    onInit(store) {
      store.authorizeTransaction();
      store.notifyOnError(store.error);
    }
  })
);

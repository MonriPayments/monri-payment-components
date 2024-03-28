import {patchState, signalStore, withHooks, withMethods, withState} from "@ngrx/signals";
import {inject} from "@angular/core";
import {KeksPayService} from "./services/keks-pay.service";
import {rxMethod} from "@ngrx/signals/rxjs-interop";
import {pipe, switchMap, tap} from "rxjs";
import {tapResponse} from "@ngrx/operators";
import {KeksPayResModel} from "./models/keks-pay.res.model";

export const KeksPayStore = signalStore(
  withState(
    {
      billid: '',
      keksid: '',
      tid: '',
      store: '',
      amount: 0,
      status: 0,
      message: '',
      showProgress: false
    }
  ),
  withMethods((
      store,
      keksPayService = inject(KeksPayService)
    ) => ({
      authorizeTransaction: rxMethod<any>(
        pipe(
          tap(() => patchState(store, { showProgress: true })),
          switchMap(() => {
            return keksPayService.authorizeTransaction().pipe(
              tapResponse({
                next: (transactionResponse: KeksPayResModel) => {
                  patchState(store, { status: transactionResponse.status, showProgress: false });
                },
                error: (error: { message: string }) => {
                  patchState(store, { showProgress: false });
                },
              }),
            );
          }),
        ),
      ),
    })

  ),
  withHooks({
    onInit({ authorizeTransaction }) {
      // @ts-ignore
      authorizeTransaction();
    },
  }),
)

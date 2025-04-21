import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import {computed, inject} from '@angular/core';
import {
  setFulfilled,
  setPending,
  withRequestStatus
} from './request-status.feature';
import {KeksPayService} from '../services/keks-pay.service';
import {TranslationService} from '../services/translation.service';
import {
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';
import {take} from 'rxjs';

export const KeksPayStore = signalStore(
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
    resolution: 0
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
      keksPayService = inject(KeksPayService),
      translationService = inject(TranslationService)
    ) => {
      const mobileViewRedirect = () => {
        window.open(store.url(), '_blank');
      };
      const startPayment = (inputParams: StartPaymentRequest) => {
        keksPayService
          .startPayment(inputParams)
          .pipe(take(1))
          .subscribe((response: StartPaymentResponse) => {
            patchState(store, {
              qr_type: '1',
              cid: response.qr_text.cid,
              tid: response.qr_text.tid,
              bill_id: response.qr_text.bill_id.toString(),
              amount: response.qr_text.amount
            });
            patchState(store, setFulfilled());
          });
      };
      const setComponentOptions = (inputParams: StartPaymentRequest) => {
        patchState(store, {
          resolution: +inputParams.data['width']
        })

        if (inputParams.data['lang']) {
          translationService.currentLang = inputParams.data['lang'];
        } else {
          throw new Error(translationService.translate('LANG_NOT_SET'));
        }

        if (inputParams.is_test) return;

        if (inputParams.data['environment']) {
          patchState(store, {
            environment: inputParams.data['environment']
          });
        } else {
          throw new Error(translationService.translate('ENV_NOT_SET'));
        }
      };
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SET_INPUT') {
          setComponentOptions(event.data.payload.inputParams);
          startPayment(event.data.payload.inputParams);
        }
        if (event.data?.type === 'SET_LANG') {
          translationService.currentLang = event.data.payload.lang;
        }
      };
      return {
        mobileViewRedirect,
        handleMessage
      };
    }
  ),
  withHooks({
    onInit(store) {
      patchState(store, setPending());
      window.addEventListener('message', store.handleMessage.bind(this));
    }
  })
);

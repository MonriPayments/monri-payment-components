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
import {Prettify} from '@ngrx/signals/src/ts-helpers';
import {
    MethodsDictionary,
    SignalsDictionary,
    SignalStoreSlices
} from '@ngrx/signals/src/signal-store-models';
import {StartPaymentRequest} from '../interfaces/alternative-payment-method.interface';

export const ApplePayStore = signalStore(
    withState({
        environment: '',
        inputParams: {
            payment_method: '',
            data: {}
        } as StartPaymentRequest,
        resolution: window.innerWidth
    }),
    withRequestStatus(),
    withComputed(store => ({
        appleButtonStyle: computed(() => {
            return {
                buttonStyle: store.inputParams().data['buttonStyle'] || 'black',
                buttonType: store.inputParams().data['buttonType'] || 'buy',
                locale: store.inputParams().data['locale'] || 'en-US',
            }
        }),
        isMobileView: computed(() => store.resolution() <= 768),
        isLoading: computed(() => store.isPending())
    })),
    withMethods(
        (
            store,
        ) => ({
            setWindowServices() {
                window.applePayStore = store;
                // window.applePayService = applePayService;
                // window.translationService = translationService;
            },
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
        // applePayService: KeksPayService;
        // translationService: TranslationService;
        applePayStore:
            | Prettify<
            SignalStoreSlices<object> &
            SignalsDictionary &
            MethodsDictionary &
            StateSignal<object>
        >
            | unknown;
    }
}

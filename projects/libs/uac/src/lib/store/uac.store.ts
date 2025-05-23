import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import {ChangeDetectorRef, ElementRef, inject} from '@angular/core';
import {TranslationService} from '../services/translation.service';
import {setError, setFulfilled, setPending, withRequestStatus} from "./request-status.feature";
import {UacMethodUtils} from "../utils/uac-method-utils";
import {UacService} from "../services/uac.service";
import {switchMap, take} from "rxjs";

export const UacStore = signalStore(
  withRequestStatus(),
  withState({
    resolution: 0,
    containerID: '' as string,
    redirectURL: undefined as string | undefined,
    paymentMethod: undefined as string | undefined,
    styleConfig: undefined as Record<string, Partial<CSSStyleDeclaration>> | undefined,
    container: undefined as HTMLElement | undefined
  }),
  withComputed(store => ({})),
  withMethods(
    (
      store,
      translationService = inject(TranslationService),
      uacService = inject(UacService),
      cdr = inject(ChangeDetectorRef)
    ) => {
      const applyInlineStyles = (userStyles: Record<string, Partial<CSSStyleDeclaration>>, container: ElementRef<HTMLDivElement>) => {
        const defaultStyles = UacMethodUtils.getDefaultStyles();
        const mergedStyles: Record<string, Partial<CSSStyleDeclaration>> = {};

        for (const key in defaultStyles) {
          mergedStyles[key] = {
            ...defaultStyles[key],
            ...(userStyles[key] || {})
          };
        }

        UacMethodUtils.applyStyles(container, mergedStyles);
      };

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SET_INPUT') {
          const inputData = event.data.payload.inputParams;
          patchState(store, {
            paymentMethod: inputData.payment_method,
            styleConfig: inputData.data.style as Record<string, Partial<CSSStyleDeclaration>>
          }, setPending());
          console.log(inputData, 'inputData');

          if (store.paymentMethod() === 'ips-rs') {
            uacService.initiatePayment(
              event.data.payload.inputParams.is_test ? 'ipgtest' : 'ipg',
              inputData.payment_method,
              inputData.data.trx_token
            ).pipe(take(1))
              .subscribe({
                next: (response) => {
                  if (UacMethodUtils.isUacRedirectComponent(inputData.payment_method)) {
                    window.open(response.redirect_url, '_blank');
                  } else {
                    patchState(store, {
                      redirectURL: response.redirect_url
                    })
                  }
                },
                error: (err) => {
                  patchState(store, setError(err))
                }
              })

          }
        }

        if (event.data?.type === 'SET_LANG') {
          translationService.currentLang = event.data.payload.lang;
        }
      };

      const loadDivContent = (container: ElementRef) => {
        if (!store.redirectURL() || !container || !store.styleConfig()) {
          console.error('redirect: ' + store.redirectURL() + ', style: ' + store.styleConfig())
          return
        }
        uacService.loadPaymentContent(store.redirectURL()!).pipe(
          take(1),
        ).subscribe({
          next: (content) => {
            if (store.paymentMethod() === 'ips-rs') {
              patchState(store, {
                containerID: 'ipsNBSContainer'
              })
              container.nativeElement.innerHTML = content;
              if (container) {
                const scripts = container.nativeElement.querySelectorAll('script');
                scripts.forEach((script: any) => {
                  const newScript = document.createElement('script');
                  if (script.src) {
                    newScript.src = script.src;
                    newScript.async = false;
                    document.head.appendChild(newScript);
                  } else {
                    newScript.text = script.textContent || '';
                    document.body.appendChild(newScript);
                  }
                });

                setTimeout(() => {
                  if (typeof (window as any).addFunctionsToDOM === 'function') {
                    (window as any).addFunctionsToDOM();
                  } else {
                    console.warn('addFunctionsToDOM is not defined on window');
                  }
                }, 0);

                UacMethodUtils.applyDefaultStyles(container);
                applyInlineStyles(store.styleConfig()!, container);
                patchState(store, setFulfilled());
                cdr.detectChanges();
              }
            }
          },
          error: (err) => {
            patchState(store, setError(err))
          }
        });
      }

      return {
        handleMessage,
        loadDivContent
      };
    }
  ),
  withHooks({
    onInit(store) {
      window.addEventListener('message', store.handleMessage.bind(this));
    }
  })
);

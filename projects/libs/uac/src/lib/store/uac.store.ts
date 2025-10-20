import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import {computed, ElementRef, inject} from '@angular/core';
import {TranslationService} from '../services/translation.service';
import {setError, setFulfilled, setPending, withRequestStatus} from "./request-status.feature";
import {UacMethodUtils} from "../utils/uac-method-utils";
import {UacService} from "../services/uac.service";
import {take} from "rxjs";

export const UacStore = signalStore(
  withRequestStatus(),
  withState({
    resolution: 0,
    redirectURL: undefined as string | undefined,
    paymentMethod: undefined as string | undefined,
    styleConfig: undefined as Record<string, Partial<CSSStyleDeclaration>> | undefined,
    container: undefined as HTMLElement | undefined
  }),
  withComputed((store) => ({
    isMobile: computed(() => store.resolution() <= 768)
  })),
  withMethods(
    (
      store,
      translationService = inject(TranslationService),
      uacService = inject(UacService)
    ) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SET_INPUT') {
          const inputData = event.data.payload.inputParams;

          patchState(store, {paymentMethod: inputData.payment_method, resolution: inputData.data.width});
          if (inputData.data.style) {
            patchState(store, {
              styleConfig: inputData.data.style as Record<string, Partial<CSSStyleDeclaration>>,
            });
          }

          if (!UacMethodUtils.isUacRedirectComponent(inputData.payment_method)) {
            patchState(store, setPending())
          }

          uacService.initiatePayment(
            event.data.payload.inputParams.is_test
              ? (event.data.payload.inputParams.environment === 'dev' ? 'ipgdev' : 'ipgtest')
              : 'ipg',
            inputData.payment_method,
            inputData.data.trx_token
          ).pipe(take(1))
            .subscribe({
              next: (response) => {
                if (UacMethodUtils.isUacRedirectComponent(inputData.payment_method)) {
                  window.parent.postMessage({type: 'REDIRECT', data: response.redirect_url}, '*');
                } else {
                  patchState(store, {redirectURL: response.redirect_url})
                }
              },
              error: (err) => {
                patchState(store, setError(err))
              }
            })
        }

        if (event.data?.type === 'SET_LANG') {
          translationService.currentLang = event.data.payload.lang;
        }
      };

      const loadDivContent = (container: ElementRef) => {
        if (!store.redirectURL() || !container || !store.styleConfig()) {
          console.error('redirect: ' + store.redirectURL() + ', style: ' + store.styleConfig());
          return;
        }

        uacService.loadPaymentContent(store.redirectURL()!).pipe(take(1)).subscribe({
          next: (content) => {
            if (store.paymentMethod() === 'ips-rs') {
              let modifiedContent = content;

              modifiedContent = modifiedContent.replace(
                /width:\s*220px;/g,
                `width: 100%; height: 100%;`
              );

              container.nativeElement.innerHTML = modifiedContent;
              if (container) {
                const scripts = container.nativeElement.querySelectorAll('script');
                scripts.forEach((script: any) => {
                  const newScript = document.createElement('script');
                  if (script.src) {
                    newScript.src = script.src;
                    newScript.async = false;
                    document.head.appendChild(newScript);
                  } else {
                    let scriptText = script.textContent || '';

                    scriptText = scriptText.replace(
                      /window\.location\.href\s*=\s*deepLink\s*;/,
                      `window.parent.postMessage({type: 'REDIRECT', data: deepLink}, '*');`
                    );

                    newScript.text = scriptText;
                    document.body.appendChild(newScript);
                  }
                });

                setTimeout(() => {
                  if (typeof (window as any).addFunctionsToDOM === 'function') {
                    (window as any).addFunctionsToDOM();

                    const mobileElements = ['ipsNBSIfMobile', 'ipsNBSIfMobileButton'];
                    const webElements = [
                      'ipsNBSQRCodeContainer',
                      'ipsNBSQRCodeTimer',
                      'generateIPSNBSPayment'
                    ];
                    mobileElements.forEach(id => {
                      const el = document.getElementById(id);
                      if (el) {
                        el.style.display = store.isMobile() ? 'block' : 'none';
                      }
                    });
                    webElements.forEach(id => {
                      const el = document.getElementById(id);
                      if (el) {
                        el.style.display = store.isMobile() ? 'none' : 'block';
                      }
                    });

                    const timerEl = document.getElementById('ipsNBSContainer');
                    if (timerEl) {
                      timerEl.style.display = 'flex';
                      timerEl.style.flexDirection = store.isMobile() ? 'column' : 'row';
                    }
                  } else {
                    console.warn('addFunctionsToDOM is not defined on window');
                  }
                }, 0);

                UacMethodUtils.applyDefaultStyles(container, store.isMobile(), store.styleConfig());
                patchState(store, setFulfilled());
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

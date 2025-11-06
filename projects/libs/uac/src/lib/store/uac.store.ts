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

          const inputParams = event?.data?.payload?.inputParams ?? {};
          const uacEnvironment = inputParams.environment === 'dev' ? 'ipgdev'
            : inputParams.is_test ? 'ipgtest'
              : 'ipg';
          uacService.initiatePayment(
            uacEnvironment,
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
            if (store.paymentMethod() === 'ips-rs' || store.paymentMethod() === 'ips-otp') {
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

                    setupContentObserver(container, store.isMobile());
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

      const setupContentObserver = (container: ElementRef, isMobile: boolean) => {
        const containerEl = container.nativeElement;
        if (!containerEl) return;

        const calculateOptimalHeight = () => {
          setTimeout(() => {
            const ipsContainer = containerEl.querySelector('#ipsNBSContainer');
            if (!ipsContainer) {
              return;
            }

            let newHeight: number;

            if (isMobile) {
              const bankLogo = ipsContainer.querySelector('#bankLogo') as HTMLImageElement;
              const bankSelect = ipsContainer.querySelector('#ipsNBSBankSelect') as HTMLSelectElement;


              const isBankSelected = bankSelect && bankSelect.value &&
                                   bankLogo && bankLogo.style.display !== 'none' &&
                                   bankLogo.src && bankLogo.src.trim() !== '';


              if (isBankSelected) {
                newHeight = 420;
              } else {
                newHeight = 360;
              }
            } else {
              const contentHeight = ipsContainer.scrollHeight;
              newHeight = Math.max(contentHeight + 40, 220);
            }

            const currentMinHeight = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--iframe-min-height') || '320');

            if (Math.abs(newHeight - currentMinHeight) > 10) {
              window.parent.postMessage({
                type: 'RESIZE_IFRAME',
                data: {
                  minHeight: `${newHeight}px`
                }
              }, '*');
            }
          }, 100);
        };

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' ||
                (mutation.type === 'attributes' &&
                 (mutation.attributeName === 'style' || mutation.attributeName === 'class'))) {
              const target = mutation.target as HTMLElement;

              if (target.id === 'bankLogo' ||
                  target.id === 'bankLogoContainer' ||
                  target.id === 'ipsNBSBankSelect' ||
                  target.closest('#bankLogoContainer') ||
                  target.closest('#ipsNBSBankSelect')) {
                calculateOptimalHeight();
              }
            }
          });
        });

        observer.observe(containerEl, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class', 'src']
        });

        setTimeout(() => {
          const bankSelect = containerEl.querySelector('#ipsNBSBankSelect') as HTMLSelectElement;
          if (bankSelect) {
            bankSelect.addEventListener('change', () => {
              setTimeout(() => calculateOptimalHeight(), 200);
            });
          }
        }, 500);

        calculateOptimalHeight();
      };

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

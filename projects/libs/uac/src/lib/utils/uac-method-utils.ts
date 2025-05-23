import {ElementRef} from "@angular/core";

export class UacMethodUtils {
  private static defaultStyles: Record<string, Partial<CSSStyleDeclaration>> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      maxWidth: '900px',
      margin: '0 auto'
    },
    descriptionRow: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1rem',
      justifyContent: 'space-between'
    },
    logo: {
      width: '100px',
      alignSelf: 'flex-start'
    },
    qrCodeContainer: {
      width: '150px',
      height: '135px',
      marginBottom: '0rem',
      display: 'flex',
      justifyContent: 'center'
    },
    regenerateBtnContainer: {},
    regenerateBtn: {
      backgroundColor: 'var(--monri-accent-background-soft-color)',
      color: 'var(--monri-accent-color)',
      fontWeight: '400',
      borderRadius: '8px',
      border: 'none',
      fontSize: 'var(--monri-normal-text-size)',
      padding: '0.4rem 1rem',
      cursor: 'pointer',
      transition: '0.3s ease-in-out'
    },
    timer: {
      marginBottom: '0rem',
      textAlign: 'center'
    },
    ifMobile: {
      display: 'block',
      marginBottom: '1rem'
    },
    mobileLabel: {},
    radioLabel: {
      display: 'inline-flex',
      alignItems: 'center',
      marginRight: '1rem'
    },
    radioInput: {
      scale: '1.2',
      margin: '0 0.5rem 0 0',
      padding: '0'
    },
    bankSelect: {
      width: '100%',
      marginBottom: '1rem',
      padding: '0.5rem',
      borderRadius: '10px',
      border: '1px solid var(--monri-gray-color)'
    }
  };

  public static getDefaultStyles(): Record<string, Partial<CSSStyleDeclaration>> {
    return JSON.parse(JSON.stringify(this.defaultStyles));
  }

  public static applyStyles(
    rootElementRef: ElementRef<HTMLDivElement>,
    styles: Record<string, Partial<CSSStyleDeclaration>>
  ): void {
    if (!rootElementRef || !styles) return;

    const rootElement = rootElementRef.nativeElement;
    console.log('hamdija', styles, rootElement);

    const safeAssign = (el: HTMLElement | null, style?: Partial<CSSStyleDeclaration>) => {
      if (el && style && typeof style === 'object') {
        Object.assign(el.style, style);
      }
    };

    safeAssign(rootElement, styles['container']);
    safeAssign(rootElement.querySelector('#ipsNBSContainer > div') as HTMLElement, styles['descriptionRow']);
    safeAssign(rootElement.querySelector('#ipsNBSContainer img') as HTMLImageElement, styles['logo']);
    safeAssign(rootElement.querySelector('#ipsNBSQRCodeContainer'), styles['qrCodeContainer']);
    safeAssign(rootElement.querySelector('#ipsNBSQRCodeContainerRegenerate'), styles['regenerateBtnContainer']);
    safeAssign(rootElement.querySelector('#ipsNBSQRCodeContainerRegenerate button') as HTMLButtonElement, styles['regenerateBtn']);
    safeAssign(rootElement.querySelector('#ipsNBSQRCodeTimer'), styles['timer']);
    safeAssign(rootElement.querySelector('#ipsNBSIfMobile'), styles['ifMobile']);
    safeAssign(rootElement.querySelector('#ipsNBSIfMobile label'), styles['mobileLabel']);
    safeAssign(rootElement.querySelector('#ipsNBSBankSelect'), styles['bankSelect']);

    if (styles['radioLabel']) {
      rootElement.querySelectorAll('label[id^="ipsNBS"]').forEach(label => {
        safeAssign(label as HTMLElement, styles['radioLabel']);
      });
    }

    if (styles['radioInput']) {
      rootElement.querySelectorAll('input[type="radio"]').forEach(input => {
        safeAssign(input as HTMLInputElement, styles['radioInput']);
      });
    }
  }



  public static applyDefaultStyles(container: ElementRef<HTMLDivElement>): void {
    const defaultStyles = this.getDefaultStyles();
    this.applyStyles(container, defaultStyles);
  }

  public static isUacRedirectComponent(paymentMethod: string): boolean {
    switch (paymentMethod) {
      case 'flik-pay':
        return true;
      default:
        return false;
    }
  }
}

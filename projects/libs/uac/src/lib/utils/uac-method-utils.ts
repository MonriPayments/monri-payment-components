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
    text: {
      display: 'block'
    },
    qrCodeContainer: {
      width: '164px',
      height: '164px',
      marginBottom: '0rem',
      display: 'flex',
      justifyContent: 'center'
    },
    regenerateBtnContainer: {},
    regenerateBtn: {
      backgroundColor: '#bcbcbc',
      color: '#000',
      fontWeight: '400',
      borderRadius: '8px',
      border: 'none',
      fontSize: '12px',
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
      border: '1px solid #bcbcbc'
    },
    generateQRButton: {
      backgroundColor: '#FCF5FF',
      color: '#8132A7',
      fontWeight: '400',
      borderRadius: '8px',
      borderColor: 'transparent',
      fontSize: '12px',
      padding: '0.2rem 0.9rem',
      transition: '0.3s ease-in-out',
      maxWidth: '150px',
      margin: '0 auto',
      display: 'block'
    },
    ifMobileButton: {
      backgroundColor: '#FCF5FF',
      color: '#8132A7',
      fontWeight: '400',
      borderRadius: '8px',
      borderColor: 'transparent',
      fontSize: '12px',
      padding: '0.2rem 0.9rem',
      transition: '0.3s ease-in-out',
      maxWidth: '150px',
      margin: '0 auto',
      display: 'block'
    },
    bankLogoContainer: {
      margin: '0 auto 2rem',
      width: '240px'
    },
    ipsNBSPersonEntity: {
      display: 'inline-flex',
      alignContent: 'center',
      marginRight: '1rem'
    },
    ipsNBSLegalEntity : {
      display: 'inline-flex',
      alignContent: 'center'
    }
  };

  public static getDefaultStyles(): Record<string, Partial<CSSStyleDeclaration>> {
    return JSON.parse(JSON.stringify(this.defaultStyles));
  }

  public static applyStyles(
    rootElementRef: ElementRef<HTMLDivElement>,
    styles: Record<string, Partial<CSSStyleDeclaration>>,
    isMobile: boolean
  ): void {
    if (!rootElementRef) return;

    const rootElement = rootElementRef.nativeElement;
    const innerContent = rootElement.querySelector('#ipsNBSContainer') as HTMLElement;
    if (!innerContent) return;

    const safeAssign = (el: HTMLElement | null, style?: Partial<CSSStyleDeclaration>) => {
      if (el && style && typeof style === 'object') {
        Object.assign(el.style, style);
      }
    };

    safeAssign(innerContent, styles['container']);

    if (!isMobile) {
      const childDivs = Array.from(innerContent.children).filter(
        (el): el is HTMLElement =>
          el.tagName === 'DIV' && !el.classList.contains('right-container')
      );

      if (childDivs.length === 0) return;

      const firstDiv = childDivs[0];
      safeAssign(firstDiv, styles['descriptionRow']);
      safeAssign(firstDiv.querySelector('#ipsNBSText') as HTMLElement, styles['text']);

      let rightContainer = innerContent.querySelector('.right-container') as HTMLElement;
      if (!rightContainer) {
        rightContainer = document.createElement('div');
        rightContainer.classList.add('right-container');
        innerContent.appendChild(rightContainer);
      }

      safeAssign(rightContainer, styles['rightContainer']);

      for (let i = 1; i < childDivs.length; i++) {
        rightContainer.appendChild(childDivs[i]);
      }

      const selectors: Record<string, string> = {
        logo: '#ipsNBSLogo',
        qrCodeContainer: '#ipsNBSQRCodeContainer',
        regenerateBtnContainer: '#ipsNBSQRCodeContainerRegenerate',
        regenerateBtn: '#ipsNBSQRCodeContainerRegenerate button',
        timer: '#ipsNBSQRCodeTimer',
        ifMobile: '#ipsNBSIfMobile',
        mobileLabel: '#ipsNBSIfMobile label',
        bankSelect: '#ipsNBSBankSelect',
        generateQRButton: '#generateIPSNBSPayment',
        ifMobileButton: '#ipsNBSIfMobileButton',
        bankLogoContainer: '#bankLogoContainer',
        ipsNBSPersonEntity: '#ipsNBSPersonEntity',
        ipsNBSLegalEntity: '#ipsNBSLegalEntity'
      };

      Object.entries(selectors).forEach(([styleKey, selector]) => {
        const element = innerContent.querySelector(selector) as HTMLElement;
        if (element) {
          safeAssign(element, styles[styleKey]);
        }
      });
    } else {
      safeAssign(innerContent.querySelector(':scope > div') as HTMLElement, styles['descriptionRow']);
      safeAssign(innerContent.querySelector('img') as HTMLImageElement, styles['logo']);
      safeAssign(innerContent.querySelector('#ipsNBSQRCodeContainer'), styles['qrCodeContainer']);
      safeAssign(innerContent.querySelector('#ipsNBSQRCodeContainerRegenerate'), styles['regenerateBtnContainer']);
      safeAssign(innerContent.querySelector('#ipsNBSQRCodeContainerRegenerate button') as HTMLButtonElement, styles['regenerateBtn']);
      safeAssign(innerContent.querySelector('#ipsNBSQRCodeTimer'), styles['timer']);
      safeAssign(innerContent.querySelector('#ipsNBSText'), styles['text']);
      safeAssign(innerContent.querySelector('#ipsNBSIfMobile'), styles['ifMobile']);
      safeAssign(innerContent.querySelector('#ipsNBSPersonEntity'), styles['ipsNBSPersonEntity']);
      safeAssign(innerContent.querySelector('#ipsNBSLegalEntity'), styles['ipsNBSLegalEntity']);
      safeAssign(innerContent.querySelector('#generateIPSNBSPayment'), styles['generateQRButton']);
      safeAssign(innerContent.querySelector('#ipsNBSIfMobileButton'), styles['ifMobileButton']);
      safeAssign(innerContent.querySelector('#bankLogoContainer'), styles['bankLogoContainer']);
      safeAssign(innerContent.querySelector('#ipsNBSIfMobile label'), styles['mobileLabel']);
      safeAssign(innerContent.querySelector('#ipsNBSBankSelect'), styles['bankSelect']);
    }

    if (styles['radioLabel']) {
      innerContent.querySelectorAll('label[id^="ipsNBS"]').forEach(label => {
        safeAssign(label as HTMLElement, styles['radioLabel']);
      });
    }

    if (styles['radioInput']) {
      innerContent.querySelectorAll('input[type="radio"]').forEach(input => {
        safeAssign(input as HTMLInputElement, styles['radioInput']);
      });
    }
  }

  public static applyDefaultStyles(
    container: ElementRef<HTMLDivElement>,
    isMobile: boolean,
    userStyles: Record<string, Partial<CSSStyleDeclaration>> = {}
  ): void {
    const defaultStyles = this.getDefaultStyles();
    const mergedStyles: Record<string, Partial<CSSStyleDeclaration>> = {};

    for (const key in defaultStyles) {
      mergedStyles[key] = {
        ...defaultStyles[key],
        ...(userStyles[key] || {})
      };
    }

    this.applyStyles(container, mergedStyles, isMobile);
  }

  public static isUacRedirectComponent(paymentMethod: string): boolean {
    switch (paymentMethod) {
      case 'flik-pay':
      case 'air-cash':
        return true;
      default:
        return false;
    }
  }
}

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
    rootElement: HTMLElement,
    styles: Record<string, Partial<CSSStyleDeclaration>>
  ): void {
    if (!rootElement) return;

    if (styles['container']) {
      Object.assign(rootElement.style, styles['container']);
    }

    if (styles['descriptionRow']) {
      const row = rootElement.querySelector('#ipsNBSContainer > div');
      if (row) Object.assign((row as HTMLElement).style, styles['descriptionRow']);
    }

    if (styles['logo']) {
      const logo = rootElement.querySelector('#ipsNBSContainer img');
      if (logo) Object.assign((logo as HTMLImageElement).style, styles['logo']);
    }

    if (styles['qrCodeContainer']) {
      const qrCode = rootElement.querySelector('#ipsNBSQRCodeContainer');
      if (qrCode) Object.assign((qrCode as HTMLElement).style, styles['qrCodeContainer']);
    }

    if (styles['regenerateBtnContainer']) {
      const btnContainer = rootElement.querySelector('#ipsNBSQRCodeContainerRegenerate');
      if (btnContainer) Object.assign((btnContainer as HTMLElement).style, styles['regenerateBtnContainer']);
    }

    if (styles['regenerateBtn']) {
      const button = rootElement.querySelector('#ipsNBSQRCodeContainerRegenerate button');
      if (button) Object.assign((button as HTMLButtonElement).style, styles['regenerateBtn']);
    }

    if (styles['timer']) {
      const timer = rootElement.querySelector('#ipsNBSQRCodeTimer');
      if (timer) Object.assign((timer as HTMLElement).style, styles['timer']);
    }

    if (styles['ifMobile']) {
      const ifMobile = rootElement.querySelector('#ipsNBSIfMobile');
      if (ifMobile) Object.assign((ifMobile as HTMLElement).style, styles['ifMobile']);
    }

    if (styles['mobileLabel']) {
      const label = rootElement.querySelector('#ipsNBSIfMobile label');
      if (label) Object.assign((label as HTMLElement).style, styles['mobileLabel']);
    }

    if (styles['radioLabel']) {
      rootElement.querySelectorAll('label[id^="ipsNBS"]').forEach(label => {
        Object.assign((label as HTMLElement).style, styles['radioLabel']);
      });
    }

    if (styles['radioInput']) {
      rootElement.querySelectorAll('input[type="radio"]').forEach(input => {
        Object.assign((input as HTMLInputElement).style, styles['radioInput']);
      });
    }

    if (styles['bankSelect']) {
      const select = rootElement.querySelector('#ipsNBSBankSelect');
      if (select) Object.assign((select as HTMLElement).style, styles['bankSelect']);
    }
  }

  public static applyDefaultStyles(container: HTMLElement): void {
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

export interface ApplePayButtonStyle {
  buttonStyle: 'black' | 'white' | 'white-outline';
  buttonType:
    | 'plain'
    | 'buy'
    | 'donate'
    | 'checkout'
    | 'book'
    | 'subscribe'
    | 'reload'
    | 'add-money'
    | 'top-up'
    | 'order'
    | 'rent'
    | 'support'
    | 'contribute'
    | 'tip';
  locale: string;
}

export interface ApplePayButtonConfig {
  countryCode: string;
  currencyCode: string;
  total: {
    label: string;
    amount: string;
  };
  supportedNetworks: string[];
  merchantCapabilities: string[];
}

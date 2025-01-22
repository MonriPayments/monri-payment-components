export interface ApplePayButtonConfig {
  buttonStyle?: 'black' | 'white' | 'white-outline';
  buttonType?:
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
  locale?: string;
  countryCode: string;
  currencyCode: string;
  totalLabel: string;
  totalAmount: string;
  supportedNetworks?: string[];
  merchantCapabilities?: string[];
}

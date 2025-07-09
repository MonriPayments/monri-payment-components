export const environment = {
  production: false,
  mobileNumber: {
    phoneNumber: '',
    countryCode: ''
  },
  ch_phone: '+',
  ch_email: '',
  firstName: '',
  lastName: '',
  encryptCardParams: {
    primaryAccountNumber: '',
    panExpirationMonth: '',
    panExpirationYear: '',
    cardSecurityCode: ''
  },
  enabled_cards: ['mastercard', 'maestro', 'visa', 'amex', 'discover']
};

// Based on this create environment.ts with correct testing data

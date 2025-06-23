export const environment = {
  production: false,
  consumer: {
    email: '',
    mobileNumber: {
      phoneNumber: '',
      countryCode: ''
    },
    firstName: '',
    lastName: ''
  },
  encryptCardParams: {
    primaryAccountNumber: '',
    panExpirationMonth: '',
    panExpirationYear: '',
    cardSecurityCode: ''
  }
};

// Based on this create environment.ts with correct testing data

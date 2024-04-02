import {Component, OnInit} from '@angular/core';

declare var google: any;

@Component({
  selector: 'lib-google-pay',
  templateUrl: './google-pay.component.html',
  standalone: true,
  styleUrls: ['./google-pay.component.scss']
})
export class GooglePayComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
    this.loadGooglePayScript();
  }

  loadGooglePayScript() {
    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.onload = () => this.onGooglePayLoaded();
    document.body.appendChild(script);
  }

  onGooglePayLoaded() {
    const paymentsClient = this.getGooglePaymentsClient();
    paymentsClient.isReadyToPay(this.getGoogleIsReadyToPayRequest())
      .then((response: any) => {
        if (response.result) {
          this.addGooglePayButton();
        }
      })
      .catch((err: any) => {
        console.error(err);
      });
  }

  getGooglePaymentsClient() {
    return new google.payments.api.PaymentsClient({
      environment: 'TEST',
      paymentDataCallbacks: {
        onPaymentAuthorized: (paymentData: any) => this.onPaymentAuthorized(paymentData)
      }
    });
  }

  onPaymentAuthorized(paymentData: any) {
    return new Promise((resolve, reject) => {
      // handle the response
      this.processPayment(paymentData)
        .then(() => {
          console.log('Payment successful!');
          resolve({transactionState: 'SUCCESS'});
        })
        .catch(() => {
          console.log('Payment failed. Insufficient funds. Please try again.');
          resolve({
            transactionState: 'ERROR',
            error: {
              intent: 'PAYMENT_AUTHORIZATION',
              message: 'Insufficient funds, try again. Next attempt should work.',
              reason: 'PAYMENT_DATA_INVALID'
            }
          });
        });
    });
  }

  addGooglePayButton() {
    const paymentsClient = this.getGooglePaymentsClient();
    const button = paymentsClient.createButton({onClick: () => this.onGooglePaymentButtonClicked()});
    document.getElementById('container')?.appendChild(button);
  }

  onGooglePaymentButtonClicked() {
    console.log('Google Pay button clicked.');
    const paymentDataRequest = this.getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = this.getGoogleTransactionInfo();

    const paymentsClient = this.getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest);
  }

  getGoogleIsReadyToPayRequest() {
    const baseCardPaymentMethod = {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        allowedCardNetworks: ["MASTERCARD", "VISA"]
      }
    };

    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [baseCardPaymentMethod]
    };
  }

  getGooglePaymentDataRequest() {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [{
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            'gateway': 'example',
            'gatewayMerchantId': 'exampleGatewayMerchantId'
          }
        }
      }],
      transactionInfo: this.getGoogleTransactionInfo(),
      merchantInfo: {
        merchantId: 'BCR2DN4TQHE6DYLO',
        merchantName: 'Harun'
      },
      callbackIntents: ["PAYMENT_AUTHORIZATION"]
    };
  }


  getGoogleTransactionInfo() {
    return {
      displayItems: [
        {
          label: "Subtotal",
          type: "SUBTOTAL",
          price: "2.00",
        },
        {
          label: "Tax",
          type: "TAX",
          price: "1.00",
        }
      ],
      countryCode: 'US',
      currencyCode: "USD",
      totalPriceStatus: "FINAL",
      totalPrice: "3.00",
      totalPriceLabel: "Total"
    };
  }

  processPayment(paymentData: any) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(paymentData);
        const paymentToken = paymentData.paymentMethodData.tokenizationData.token;
        resolve({});
      }, 3000);
    });
  }
}

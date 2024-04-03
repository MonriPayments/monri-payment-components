import {Component, Input, OnInit} from '@angular/core';

declare var google: any;

@Component({
  selector: 'lib-google-pay',
  templateUrl: './google-pay.component.html',
  standalone: true,
  styleUrls: ['./google-pay.component.scss']
})
export class GooglePayComponent implements OnInit {

  @Input() googleTransactionInfo: any
  @Input() googlePaymentDataRequest: any
  @Input() googleIsReadyToPayRequest: any
  @Input() googleErrorState: any
  @Input() googleTransactionState?: { onSuccess: string, onError: string }
  @Input() googleEnvironment?: string

  ngOnInit(): void {
    console.log(this.googleTransactionInfo)
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
    paymentsClient
      .isReadyToPay(this.googleIsReadyToPayRequest)
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
      environment: this.googleEnvironment,
      paymentDataCallbacks: {
        onPaymentAuthorized: (paymentData: any) =>
          this.onPaymentAuthorized(paymentData)
      }
    });
  }

  onPaymentAuthorized(paymentData: any) {
    return new Promise((resolve, reject) => {
      // handle the response
      this.processPayment(paymentData)
        .then(() => {
          console.log('Payment successful!');
          resolve({transactionState: this.googleTransactionState?.onSuccess});
        })
        .catch(() => {
          console.log('Payment failed. Insufficient funds. Please try again.');
          resolve({
            transactionState: this.googleTransactionState?.onError,
            error: this.googleErrorState
          });
        });
    });
  }

  addGooglePayButton() {
    const paymentsClient = this.getGooglePaymentsClient();
    const button = paymentsClient.createButton({
      onClick: () => this.onGooglePaymentButtonClicked()
    });
    document.getElementById('container')?.appendChild(button);
  }

  onGooglePaymentButtonClicked() {
    console.log('Google Pay button clicked.');
    const paymentDataRequest = this.googlePaymentDataRequest;
    paymentDataRequest.transactionInfo = this.googleTransactionInfo;

    const paymentsClient = this.getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest);
  }

  processPayment(paymentData: any) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(paymentData);
        const paymentToken =
          paymentData.paymentMethodData.tokenizationData.token;
        resolve({});
      }, 3000);
    });
  }
}

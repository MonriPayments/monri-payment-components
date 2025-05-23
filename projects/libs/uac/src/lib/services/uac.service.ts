import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {from, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UacService {
  protected readonly http = inject(HttpClient)

  // TODO Add response type
  initiatePayment(hostname: string, paymentMethod: string, token: string): Observable<any> {
    return this.http.post(`https://${hostname}.monri.com/v2/uac/${paymentMethod}/${token}/initiate-payment`, {});
  }

  loadPaymentContent(url: string) {
    return from(
      fetch(url).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch content from ${url}`);
        }
        return response.text();
      })
    );
  }
}

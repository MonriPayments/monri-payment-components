import { inject, Injectable } from '@angular/core';
import { KeksPayStateModel } from '../models/keks-pay.req.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as CryptoJS from 'crypto-js';
import { of } from 'rxjs';

const keksPayApiUrl = 'https://kekspayuat.erstebank.hr/eretailer';

@Injectable({
  providedIn: 'root'
})
export class KeksPayService {
  readonly #http = inject(HttpClient);

  authorizeTransaction() {
    const encodedHash = this.calculateHash(
      '123456666',
      0,
      123.45,
      'HGHGHG121222',
      '8547254'
    );
    console.log(encodedHash, 'hamdija');

    return of({
      status: 1,
      message: encodedHash
    });
    // const headers = new HttpHeaders({
    //   'Authorization': encodedHash
    // });
    //
    // return this.httpClient.post('eretailer', {
    //   "bill_id": 'HGHGHG121222',
    //   "keks_id": '8547254',
    //   "tid": '123456666',
    //   "store": 'WEBSHOP',
    //   "amount": 123.45,
    //   "status": 0,
    //   "message": 'Paid'
    // }, {headers: headers});
  }

  calculateHash(
    tid: any,
    epochtime: any,
    amount: any,
    billId: any,
    deskey: any
  ) {
    let hashInput = String(epochtime).concat(tid, amount, billId);
    let md5Value = CryptoJS.enc.Hex.stringify(
      CryptoJS.MD5(hashInput)
    ).toUpperCase();
    let desEncrypt = CryptoJS.TripleDES.encrypt(
      CryptoJS.enc.Hex.parse(md5Value),
      CryptoJS.enc.Utf8.parse(deskey),
      {
        iv: CryptoJS.enc.Hex.parse('0000000000000000'),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    return CryptoJS.enc.Hex.stringify(desEncrypt.ciphertext).toUpperCase();
  }
}

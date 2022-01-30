import { Injectable } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider';
import { from, Observable } from 'rxjs';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  constructor() {}

  /*public getProvider(): Observable<unknown> {
    //convert Promise to Observable
    return from(detectEthereumProvider());
  }*/

  currentAccount(): Observable<string> {
    return new Observable((subscriber) => {
      window.ethereum.enable().then(() => {
        window.ethereum
          .request({
            method: 'eth_requestAccounts',
          })
          .then((accounts: string | any[]) => {
            subscriber.next(accounts.length > 0 ? accounts[0] : null);
          });
      });
    });
  }
}

import { Injectable } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  constructor() {}

  public getProvider(): Observable<unknown> {
    //convert Promise to Observable
    return from(detectEthereumProvider());
  }
}

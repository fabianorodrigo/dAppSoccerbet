import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';

@Injectable({
  providedIn: 'root',
})
export class NumbersService {
  constructor() {}

  /**
   * Time in Ethereum are represented in 'seconds' since 1/1/1970. While in Javascript, it's in milliseconds
   * @param timeInMillisJS Time in milliseconds since 1/1/1970 UTC
   * @returns Time in seconds since 1/1/1970 UTC
   */
  convertTimeJSToChain(timeInMillisJS: number) {
    return new BigNumber(timeInMillisJS / 1000);
  }
}

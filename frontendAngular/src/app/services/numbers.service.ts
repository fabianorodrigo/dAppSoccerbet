import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';

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

  /**
   * Time in Ethereum are represented in 'seconds' since 1/1/1970. While in Javascript, it's in milliseconds
   * @param timeInSeconds Time in seconds since 1/1/1970 UTC
   * @returns Time in milliseconds since 1/1/1970 UTC
   */
  convertTimeChainToJS(timeInSeconds: number) {
    return timeInSeconds * 1000;
  }

  /**
   * @param bn Return the {bn} formatted with thousands separator
   */
  formatBN(bn: BN): string {
    if (!bn) return '?';
    let result = '';
    const bnString = bn.toString();
    for (let i = bnString.length; i > 0; i = i - 3) {
      result =
        bnString.substring(i - 3, i) + (result.length > 0 ? ',' : '') + result;
    }
    return result;
  }
}

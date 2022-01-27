import { Inject, Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils/types';
import contractABI from '../../../../backendOnChain/build/contracts/BetToken.json';
import { WEB3 } from '../core/web3';
import { BaseContract } from './baseContract';

@Injectable({
  providedIn: 'root',
})
export class BetTokenService extends BaseContract {
  constructor(@Inject(WEB3) web3: Web3) {
    super(web3, environment.betTokenAddress);
  }

  balanceOf(accountAddress: string): Observable<BigNumber> {
    return new Observable<BigNumber>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (contract) => {
          let result;
          try {
            result = await contract.methods.balanceOf(accountAddress).call();
          } catch (e: any) {
            alert(e.message);
          }
          subscriber.next(result);
        }
      );
    });
  }
}

import { BaseContract } from './baseContract';
import { AbiItem } from 'web3-utils/types';
import { Inject, Injectable } from '@angular/core';
import { catchError, finalize, of, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Web3Service } from '../services';
import contractABI from '../../../../backendOnChain/build/contracts/BetToken.json';
import Web3 from 'web3';
import { WEB3 } from '../core/web3';
import { Contract } from 'web3-eth-contract';
import BigNumber from 'bignumber.js';

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
          const result = await contract.methods
            .balanceOf(accountAddress)
            .call();
          console.log('result', result);
          subscriber.next(result);
        }
      );
    });
  }
}

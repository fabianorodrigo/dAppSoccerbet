import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AbiItem } from 'web3-utils/types';
import contractABI from '../../../../backendOnChain/build/contracts/BetToken.json';
import { Web3Service } from '../services';
import { BaseContract } from './baseContract';

@Injectable({
  providedIn: 'root',
})
export class BetTokenService extends BaseContract {
  constructor(_web3Service: Web3Service) {
    super(_web3Service, environment.betTokenAddress);
  }

  balanceOf(_accountAddress: string): Observable<BigNumber> {
    return new Observable<BigNumber>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (contract) => {
          let result;
          try {
            result = await contract.methods.balanceOf(_accountAddress).call();
          } catch (e: any) {
            alert(e.message);
          }
          subscriber.next(result);
        }
      );
    });
  }
}

import { BaseContract } from './baseContract';
import { Inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import Web3 from 'web3';
import { WEB3 } from '../core/web3';
import { Observable } from 'rxjs';
import contractABI from '../../../../backendOnChain/build/contracts/GameFactory.json';
import { AbiItem } from 'web3-utils';

@Injectable({
  providedIn: 'root',
})
export class GameFactoryService extends BaseContract {
  constructor(@Inject(WEB3) web3: Web3) {
    super(web3, environment.gameFactoryAddress);
  }

  owner(): Observable<string> {
    return new Observable<string>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (contract) => {
          const result = await contract.methods.owner().call();
          console.log(`owner() valido? `, this.web3.utils.isAddress(result));
          subscriber.next(result);
        }
      );
    });
  }
}

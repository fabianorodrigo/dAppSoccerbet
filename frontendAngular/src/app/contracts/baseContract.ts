import { Inject } from '@angular/core';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { WEB3 } from '../core/web3';

export class BaseContract {
  protected contract!: Contract;
  protected address: string;

  constructor(protected web3: Web3, address: string) {
    this.address = address;
  }

  protected getContract(abis: AbiItem[]): Observable<Contract> {
    return new Observable((subscriber) => {
      if (this.contract != null) {
        subscriber.next(this.contract);
      } else if (this.web3) {
        subscriber.next(new this.web3.eth.Contract(abis, this.address));
      } else {
        throw new Error(`Web3 not instanciated`);
      }
    });
  }
}

import { Injectable, OnInit } from '@angular/core';
import BN from 'bn.js';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AbiItem } from 'web3-utils/types';
import contractABI from '../../../../backendOnChain/build/contracts/BetToken.json';
import { TransactionResult } from '../model';
import { MessageService, Web3Service } from '../services';
import { BaseContract } from './baseContract';

@Injectable({
  providedIn: 'root',
})
export class BetTokenService extends BaseContract {
  static EVENTS = {
    MINTED: 'TokenMinted',
  };

  constructor(_messageService: MessageService, _web3Service: Web3Service) {
    super(_messageService, _web3Service, environment.betTokenAddress);
  }

  getContractABI(): AbiItem[] {
    return contractABI.abi as AbiItem[];
  }

  balanceOf(_accountAddress: string): Observable<BN> {
    return new Observable<BN>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then(async (contract) => {
          let result;
          try {
            result = await contract.methods.balanceOf(_accountAddress).call();
          } catch (e: any) {
            alert(e.message);
          }
          subscriber.next(result);
        })
        .catch((e) => {
          console.warn(`bettoken`, e);
        });
    });
  }

  buy(_fromAccountAddress: string, _value: BN): Observable<TransactionResult> {
    return this._web3Service.sendWei(
      _fromAccountAddress,
      environment.betTokenAddress,
      _value
    );
  }
}

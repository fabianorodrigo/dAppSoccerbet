import { Injectable } from '@angular/core';
import BN from 'bn.js';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AbiItem } from 'web3-utils/types';
import contractABI from '../../../../backend-truffle/build/contracts/BetToken.json';
import { ProviderErrors, TransactionResult } from '../model';
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
          let _balance;
          try {
            _balance = await contract.methods.balanceOf(_accountAddress).call();
          } catch (e: any) {
            alert(e.message);
          }
          subscriber.next(new BN(_balance));
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

  approve(
    _fromAccountAddress: string,
    _toAccountAddress: string,
    _value: BN
  ): Observable<TransactionResult> {
    return new Observable<TransactionResult>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then(async (contract) => {
          let result;
          try {
            result = await contract.methods
              .approve(_toAccountAddress, _value)
              .send({
                from: _fromAccountAddress,
              });
            subscriber.next({
              success: true,
              message:
                'Transaction to approve allowance of BetTokens was sent successfully',
            });
          } catch (e: any) {
            const providerError = ProviderErrors[e.code];
            let message = `We had some problem. The transaction wasn't sent.`;
            if (providerError) {
              message = `${providerError.title}: ${providerError.message}. The transaction wasn't sent.`;
            }
            console.warn(e);
            subscriber.next({ success: false, message: message });
          }
        })
        .catch((e) => {
          console.warn(`bettoken`, e);
        });
    });
  }
}

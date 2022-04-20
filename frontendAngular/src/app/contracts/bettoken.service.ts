import { Injectable } from '@angular/core';
import BN from 'bn.js';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AbiItem } from 'web3-utils/types';
import contractABI from '../../../../backend-hardhat/artifacts/contracts/BetToken.sol/BetTokenUpgradeable.json';
import { CallbackFunction, ProviderErrors, TransactionResult } from '../model';
import { MessageService, Web3Service } from '../services';
import { BaseContract } from './baseContract';

@Injectable({
  providedIn: 'root',
})
export class BetTokenService extends BaseContract {
  static EVENTS = {
    MINTED: 'TokenMinted',
    APPROVAL: 'Approval',
    TRANSFER: 'Transfer',
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

  buy(_fromAccountAddress: string, _value: BN, _callback?: CallbackFunction): Observable<TransactionResult<string>> {
    return this._web3Service.sendWei(
      _fromAccountAddress,
      environment.betTokenAddress,
      _value,
      `Transaction to buy Bet Tokens was sent successfully`,
      _callback,
      `Transaction to buy Bet Tokens was confirmed`
    );
  }

  approve(
    _fromAccountAddress: string,
    _toAccountAddress: string,
    _value: BN,
    _callback?: CallbackFunction
  ): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'approve',
      `Transaction to approve allowance of Bet Tokens was sent successfully`,
      _callback,
      `Transaction to approve allowance of Bet Tokens was confirmed`,
      _toAccountAddress,
      _value
    );
  }

  /**
   * Returns the remaining number of BetTokens that the {_gameContractAddress} will be allowed to spend on behalf
   * of the owner {_accountAddress} through transferFrom. This is zero by default
   *
   * @param _accountAddress Bettor account address
   * @param _gameContractAddress Game Contract address
   * @returns The quantity of BetTokens remaining
   */
  allowance(_accountAddress: string, _gameContractAddress: string): Observable<TransactionResult<BN>> {
    return this.call<BN>(contractABI.abi as AbiItem[], `allowance`, _accountAddress, _gameContractAddress);
  }

  /**
   * Send an transaction with {_toAccountAddress} account to exchange the quantity {_value} of Soccer Bet Tokens por the equivalent in Ether
   * The amount of Bet tokens will be burned after all
   *
   * @param _toAccountAddress Sender of transaction (recipient of Ethers when the transaction is confirmed)
   * @param _value Amount of Soccer Bet Tokens to be exchange
   * @param _callback  Function to be called when the transaction is confirmed
   * @returns The details of sending transaction
   */
  exchange4Ether(
    _toAccountAddress: string,
    _value: BN,
    _callback?: CallbackFunction
  ): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'exchange4Ether',
      `Transaction to exchange your Bet Tokens for Ether was sent successfully`,
      _callback,
      `Transaction to exchange your Bet Tokens for Ether was confirmed`,
      _value
    );
  }
}

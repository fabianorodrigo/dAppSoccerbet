import { TransactionResult } from './../model/transaction-result.interface';
import { BaseContract } from './baseContract';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MessageService, NumbersService, Web3Service } from '../services';
import contractABI from '../../../../backendOnChain/build/contracts/Game.json';
import { AbiItem } from 'web3-utils';
import { Observable, Subscriber } from 'rxjs';

export class GameService extends BaseContract {
  static EVENTS = {
    GAME_OPENED: 'GameOpened',
    GAME_CLOSED: 'GameClosed',
    GAME_FINALIZED: 'GameFinalized',
  };

  constructor(_web3Service: Web3Service, _address: string) {
    super(_web3Service, _address);
    this.getContract(contractABI.abi as AbiItem[]).subscribe((_contract) => {
      //For all events in the static member EVENTS
      this.initEventListeners(_contract, Object.values(GameService.EVENTS));
    });
  }

  openForBetting(): Observable<TransactionResult> {
    return this.sendParamlessVoidFunction(
      contractABI.abi as AbiItem[],
      'openForBetting',
      'Transaction to open the game for betting was sent successfully'
    );
  }

  closeForBetting(): Observable<TransactionResult> {
    return this.sendParamlessVoidFunction(
      contractABI.abi as AbiItem[],
      'closeForBetting',
      'Transaction to close the game for betting was sent successfully'
    );
  }

  owner(): Observable<string> {
    return this.getString(contractABI.abi as AbiItem[], 'owner');
  }

  homeTeam(): Observable<string> {
    return this.getString(contractABI.abi as AbiItem[], 'homeTeam');
  }
  visitorTeam(): Observable<string> {
    return this.getString(contractABI.abi as AbiItem[], 'visitorTeam');
  }
  datetimeGame(): Observable<number> {
    return this.getNumber(contractABI.abi as AbiItem[], 'datetimeGame');
  }
  open(): Observable<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], 'open');
  }
  finalized(): Observable<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], 'finalized');
  }
}

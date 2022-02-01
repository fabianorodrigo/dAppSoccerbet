import { BaseContract } from './baseContract';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { NumbersService, Web3Service } from '../services';
import contractABI from '../../../../backendOnChain/build/contracts/Game.json';
import { AbiItem } from 'web3-utils';
import { Observable } from 'rxjs';

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

  openForBetting(): Observable<void> {
    return new Observable<void>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (_contract) => {
          let result;
          this._web3Service.currentAccount().subscribe(async (fromAccount) => {
            try {
              result = await _contract.methods
                .openForBetting()
                .send({ from: fromAccount });
              subscriber.next();
            } catch (e) {
              console.warn(e);
              subscriber.next();
            }
          });
        }
      );
    });
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

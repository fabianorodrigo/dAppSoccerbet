import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AbiItem } from 'web3-utils';
import contractABI from '../../../../backend-hardhat/artifacts/contracts/GameFactory.sol/GameFactoryUpgradeable.json';
import { Game } from '../model';
import { MessageService, NumbersService, Web3Service } from './../services';
import { BaseContract } from './baseContract';

@Injectable({
  providedIn: 'root',
})
export class GameFactoryService extends BaseContract {
  static EVENTS = {
    GAME_CREATED: 'GameCreated',
  };

  constructor(_messageService: MessageService, _web3Service: Web3Service, private _numberService: NumbersService) {
    super(_messageService, _web3Service, environment.gameFactoryAddress);
  }

  getContractABI(): AbiItem[] {
    return contractABI.abi as AbiItem[];
  }

  newGame(_game: Game): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).then(async (_contract) => {
        let result;
        this._web3Service.getUserAccountAddress().subscribe(async (fromAccount) => {
          try {
            result = await _contract.methods
              .newGame(_game.homeTeam, _game.visitorTeam, this._numberService.convertTimeJSToChain(_game.datetimeGame))
              .send({ from: fromAccount });
            subscriber.next(true);
          } catch (e) {
            console.warn(e);
            subscriber.next(false);
          }
        });
      });
    });
  }

  exists(id: any) {
    return false;
    //TODO: Implementar
  }
}

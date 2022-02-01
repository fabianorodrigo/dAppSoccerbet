import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AbiItem } from 'web3-utils';
import contractABI from '../../../../backendOnChain/build/contracts/GameFactory.json';
import { Game } from '../model';
import { NumbersService, Web3Service } from './../services';
import { BaseContract } from './baseContract';

@Injectable({
  providedIn: 'root',
})
export class GameFactoryService extends BaseContract {
  static EVENTS = {
    GAME_CREATED: 'GameCreated',
  };

  constructor(
    _web3Service: Web3Service,
    private _numberService: NumbersService
  ) {
    super(_web3Service, environment.gameFactoryAddress);

    this.getContract(contractABI.abi as AbiItem[]).subscribe((_contract) => {
      //For all events in the static member EVENTS
      this.initEventListeners(
        _contract,
        Object.values(GameFactoryService.EVENTS)
      );
    });
  }

  owner(): Observable<string> {
    return this.getString(contractABI.abi as AbiItem[], 'owner');
  }

  listGames(): Observable<string[]> {
    return new Observable<string[]>((_subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (contract) => {
          let result = [];
          try {
            result = await contract.methods.listGames().call();
            console.log(`list GAmes invocado `, result);
          } catch (e) {
            console.warn(e);
          }
          _subscriber.next(result);
        }
      );
    });
  }

  newGame(_game: Game): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (_contract) => {
          let result;
          this._web3Service.currentAccount().subscribe(async (fromAccount) => {
            try {
              result = await _contract.methods
                .newGame(
                  _game.homeTeam,
                  _game.visitorTeam,
                  this._numberService.convertTimeJSToChain(_game.datetimeGame)
                )
                .send({ from: fromAccount });
              console.log(`newGame chamado`, _game);
              subscriber.next(true);
            } catch (e) {
              console.warn(e);
              subscriber.next(false);
            }
          });
        }
      );
    });
  }

  exists(id: any) {
    return false;
    //TODO: Implementar
  }
}

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

  getContractABI(): AbiItem[] {
    return contractABI.abi as AbiItem[];
  }

  // listGames(): Observable<string[]> {
  //   return this.getStringArray(contractABI.abi as AbiItem[], 'listGames');
  // }

  /**
   * Fetch the list of games registered in the GameFactory
   */
  listGamesDTO(): Observable<Game[]> {
    return new Observable<Game[]>((_subscriber) => {
      this.getProperty(contractABI.abi as AbiItem[], 'listGames', _subscriber);
    });
  }

  newGame(_game: Game): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (_contract) => {
          let result;
          this._web3Service
            .getUserAccountAddress()
            .subscribe(async (fromAccount) => {
              try {
                result = await _contract.methods
                  .newGame(
                    _game.homeTeam,
                    _game.visitorTeam,
                    this._numberService.convertTimeJSToChain(_game.datetimeGame)
                  )
                  .send({ from: fromAccount });
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

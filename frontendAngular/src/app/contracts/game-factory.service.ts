import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import contractABI from '../../../../backendOnChain/build/contracts/GameFactory.json';
import { WEB3 } from '../core/web3';
import { Game } from '../model';
import { NumbersService, Web3Service } from './../services';
import { BaseContract } from './baseContract';

@Injectable({
  providedIn: 'root',
})
export class GameFactoryService extends BaseContract {
  constructor(
    @Inject(WEB3) web3: Web3,
    private web3Service: Web3Service,
    private numberService: NumbersService
  ) {
    super(web3, environment.gameFactoryAddress);
  }

  owner(): Observable<string> {
    return new Observable<string>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (contract) => {
          let result;
          try {
            result = await contract.methods.owner().call();
            console.log(`owner() valido? `, this.web3.utils.isAddress(result));
          } catch (e) {
            console.warn(e);
          }
          subscriber.next(result);
        }
      );
    });
  }

  listGames(): Observable<Game[]> {
    return new Observable<Game[]>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (contract) => {
          let result = [];
          try {
            result = await contract.methods.listGames().call();
            console.log(`list GAmes invocado `, result);
          } catch (e) {
            console.warn(e);
          }
          subscriber.next(result);
        }
      );
    });
  }

  newGame(game: Game): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[]).subscribe(
        async (contract) => {
          let result;
          this.web3Service.currentAccount().subscribe(async (fromAccount) => {
            try {
              result = await contract.methods
                .newGame(
                  game.homeTeam,
                  game.visitorTeam,
                  this.numberService.convertTimeJSToChain(game.datetimeGame)
                )
                .send({ from: fromAccount });
              console.log(`newGame chamado`, game);
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

import { GameFactoryService } from '../../contracts/game-factory.service';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { Web3Service } from 'src/app/services';

@Injectable({
  providedIn: 'root',
})
export class OwnerGuard implements CanActivate {
  constructor(
    private _web3Service: Web3Service,
    private _gameFactory: GameFactoryService
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    return new Observable<boolean>((subscriber) => {
      this._web3Service
        .getUserAccountAddressSubject()
        .subscribe((userAddress) => {
          this._gameFactory.owner().subscribe((ownerAddress) => {
            subscriber.next(userAddress == ownerAddress);
          });
        });
    });
  }
}

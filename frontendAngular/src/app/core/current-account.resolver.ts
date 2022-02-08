import { Injectable } from '@angular/core';
import {
  Router,
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of, take } from 'rxjs';
import { Web3Service } from '../services';

/**
 * Resolver to get the current account in the wallet
 */
@Injectable({
  providedIn: 'root',
})
export class CurrentAccountResolver implements Resolve<string | null> {
  constructor(private _web3Service: Web3Service) {}
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<string | null> {
    /*console.log('bateu aqui?');
    const e = this._web3Service.getUserAccountAddress();
    console.log(
      `The observable that resolve() is about to return: ${JSON.stringify(e)}`
    );
    e.subscribe((evt) =>
      console.log(
        `The value that the observable resolves to: ${JSON.stringify(evt)}`
      )
    );
    return e.pipe(take(1));*/
    //TODO: THIS WAY IS NOT WORKING, MAYBE BECAUSE IT'S A BEHAVIORSUBJECT. CHECK LATER
    return this._web3Service.getUserAccountAddress();
  }
}

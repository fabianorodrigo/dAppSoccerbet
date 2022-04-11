import { Injectable } from '@angular/core';
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
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
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<string | null> {
    //TODO: THIS WAY IS NOT WORKING, MAYBE BECAUSE IT'S A BEHAVIORSUBJECT. CHECK LATER
    return this._web3Service.getUserAccountAddress();
  }
}

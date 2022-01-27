import { GameFactoryService } from './../../../contracts/game-factory.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, Input, OnInit } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';

@Component({
  selector: 'dapp-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @Input() title: String = 'Ðapp';
  @Input() icon!: String;
  owner!: string | null;
  wallet!: string | null;

  menuItems = ['Home', 'Admin'];

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => {
        return result.matches;
      }),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private gameFactory: GameFactoryService
  ) {}

  ngOnInit(): void {
    this.getOwner().subscribe((ownerAddress) => {
      this.owner = ownerAddress;
      console.log(`OnInit subscribe owner`, this.owner);
    });
  }

  private getOwner(): Observable<string> {
    return new Observable<string>((subscriber) => {
      this.gameFactory
        .owner()
        .pipe(
          //if an error in the HTTP request occurs we are going to return an Observable that emits the
          //empty array using 'of'
          catchError((e) => {
            return of('');
          })
        )
        .subscribe((ownerAddress) => {
          subscriber.next(ownerAddress);
        });
    });
  }

  changeWalletAccount(address: string | null) {
    this.wallet = address;
    console.warn(`wallet: ${this.wallet}`);
    //if owner was not set yet, try again
    this.getOwner().subscribe((ownerAddress) => {
      this.owner = ownerAddress;
      console.log(`changeWalletAccount subscribe owner`, this.owner);
      if (!ownerAddress) {
        alert(
          `Connection with contract failed. Check if you are connected with your account in the right chain`
        );
      }
    });
  }
}

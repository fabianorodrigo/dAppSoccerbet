import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { GameFactoryService } from './contracts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Soccer Bet Ðapp';
  icon = 'sports_soccer';
  userAccountAddress: string | null = null;
  owner: string | null = null;

  constructor(private gameFactory: GameFactoryService) {}

  ngOnInit(): void {
    console.log(`BetToken.address`, environment.betTokenAddress);
    console.log(`GameFactory.address`, environment.gameFactoryAddress);

    this.getOwner().subscribe((ownerAddress) => {
      this.owner = ownerAddress;
      console.log(`OnInit subscribe owner`, this.owner);
    });
  }

  changeWalletAccount(address: string | null) {
    this.userAccountAddress = address;
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
}

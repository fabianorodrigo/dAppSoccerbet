import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { GameFactoryService } from './contracts';
import { MessageService, Web3Service } from './services';

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

  constructor(
    private _web3Service: Web3Service,
    private _gameFactory: GameFactoryService,
    private _messageService: MessageService
  ) {}

  ngOnInit(): void {
    console.log(`BetToken.address`, environment.betTokenAddress);
    console.log(`GameFactory.address`, environment.gameFactoryAddress);

    this.getOwner().subscribe((ownerAddress) => {
      this.owner = ownerAddress;
    });

    this._web3Service.getUserAccountAddressSubject().subscribe((address) => {
      this.changeWalletAccount(address);
    });
  }

  changeWalletAccount(_address: string | null) {
    //if owner was not set yet, try again
    if (!this.owner) {
      this.getOwner().subscribe((ownerAddress) => {
        this.owner = ownerAddress;
        if (!ownerAddress) {
          this._messageService.show(
            `Connection with contract failed. Check if you are connected with your account in the right chain`
          );
        } else {
          this.userAccountAddress = _address;
        }
      });
    } else {
      this.userAccountAddress = _address;
    }
  }

  private getOwner(): Observable<string> {
    return new Observable<string>((subscriber) => {
      this._gameFactory
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

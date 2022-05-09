import { environment } from 'src/environments/environment';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
    private _changeDetectorRefs: ChangeDetectorRef,
    private _web3Service: Web3Service,
    private _gameFactory: GameFactoryService,
    private _messageService: MessageService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log(`BetToken.address`, environment.betTokenAddress);
    console.log(`GameFactory.address`, environment.gameFactoryAddress);

    const chainId = await this._web3Service.getCurrentChainId();
    if (chainId != environment.chainId) {
      const msg = `Unexpected chain: Change network to ${environment.chainName}`;
      this._messageService.show(msg);
      throw new Error(msg);
    }

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
            `Connection with contract failed. Check if you are connected with your account on ${environment.chainName} network`
          );
        } else {
          this.userAccountAddress = _address;
          this._changeDetectorRefs.detectChanges();
        }
      });
    } else {
      this.userAccountAddress = _address;
      this._changeDetectorRefs.detectChanges();
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

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as BN from 'bn.js';
import { BetTokenService } from 'src/app/contracts';
import { BetTokenMintedEvent as BetTokenReceivedEvent, ERC20Transfer, TransactionResult } from 'src/app/model';
import { MessageService, NumbersService, Web3Service } from 'src/app/services';
import { environment } from 'src/environments/environment';
import { BuyDialogComponent } from '../buy-dialog/buy-dialog.component';

@Component({
  selector: 'dapp-bettoken-home',
  templateUrl: './bettoken-home.component.html',
  styleUrls: ['./bettoken-home.component.css'],
})
export class BettokenHomeComponent implements OnInit {
  userAccountAddress: string | null = null;
  formatedBalance: string = '0';
  formatedBalanceTooltip: string = '0';
  chainCurrencyName: string = environment.chainCurrencyName;

  isAdmin: boolean = false;
  paused: boolean = false;

  // just control of the `loading` visual behavior
  currentAction = Action.NONE;
  loading: boolean = false;

  constructor(
    private _changeDetectorRefs: ChangeDetectorRef,
    private _web3Service: Web3Service,
    private _betTokenService: BetTokenService,
    private _messageService: MessageService,
    private _numberService: NumbersService,
    private _dialog: MatDialog,
    private _router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Subscribing for account address changes in the provider
    this._web3Service.getUserAccountAddressSubject().subscribe(async (address) => {
      this.userAccountAddress = address;
      this.paused = await this._betTokenService.paused();
      this.getBalance();
    });
    //check if it the account is owner of BetToken
    this._betTokenService.isOwner().subscribe((is) => {
      //It is admin if the user is the owner of GameFactory contract and the route starts with '/admin'
      this.isAdmin = is && this._router.url.startsWith('/admin');
    });
    try {
      // Subscribing for transfer of Ether to the BetToken contract and, consequently,
      // balance of BetTokens changes
      (
        await this._betTokenService.getEventBehaviorSubject({
          eventName: BetTokenService.EVENTS.MINTED,
          filter: {
            tokenBuyer: this.userAccountAddress,
          },
        })
      )?.subscribe((evt) => {
        if (evt == null) return;
        const eventData: BetTokenReceivedEvent = evt;
        this._messageService.show(
          `A transaction of ${this._numberService.formatBNShortScale(eventData.quantity)} tokens was confirmed`
        );
        this.getBalance();
      });
      (
        await this._betTokenService.getEventBehaviorSubject({
          eventName: BetTokenService.EVENTS.TRANSFER,
          filter: {
            from: this.userAccountAddress,
          },
        })
      )?.subscribe((evt) => {
        if (evt == null) return;
        const eventData: ERC20Transfer = evt;
        this._messageService.show(
          `A exchange of ${this._numberService.formatBNShortScale(eventData.value)} tokens was confirmed`
        );
        this.getBalance();
      });
    } catch (e: any) {
      this._messageService.show(e.message);
    }
  }

  buy(event: MouseEvent) {
    if (!this.userAccountAddress) return;
    this.action(Action.BALANCE);
    this._web3Service.chainCurrencyBalanceOf(this.userAccountAddress).subscribe((_balance) => {
      this.action();
      const dialogRef = this._dialog.open(BuyDialogComponent, {
        data: {
          title: `Buy Soccer Bet Tokens`,
          maxAmmount: new BN(_balance),
        },
      });

      dialogRef.afterClosed().subscribe((_purchaseData) => {
        if (_purchaseData) {
          if (_purchaseData.value != null && this.userAccountAddress) {
            this.action(Action.BUY);
            this._betTokenService
              .buy(this.userAccountAddress, new BN(_purchaseData.value), this._genericCallback.bind(this))
              .subscribe((_result) => {
                //this._messageService.show(_result.result);
              });
          } else {
            this._messageService.show(`Quantity of Bet Tokens is not valid`);
          }
        }
      });
    });
  }

  private _genericCallback(confirmationResult: TransactionResult<string>) {
    this.action();
    // not showing message because the capture of the event is already doing it
    //this._messageService.show(confirmationResult.result);
    this._changeDetectorRefs.detectChanges();
    if (confirmationResult.success == false) {
      this._messageService.show(confirmationResult.result);
    }
  }

  exchange(event: MouseEvent) {
    if (!this.userAccountAddress) return;
    this.action(Action.BALANCE);
    this._betTokenService.balanceOf(this.userAccountAddress).subscribe((_balanceSBT) => {
      this.action();
      if (_balanceSBT.success == false) {
        this._messageService.show(`It was not possible to get Bet Tokens balance`);
        return;
      }
      const dialogRef = this._dialog.open(BuyDialogComponent, {
        data: {
          title: `Exchange Soccer Bet Tokens for Ether`,
          maxAmmount: new BN(_balanceSBT.result),
        },
      });

      dialogRef.afterClosed().subscribe((_amount) => {
        if (_amount) {
          if (_amount.value != null && this.userAccountAddress) {
            this.action(Action.EXCHANGE);
            this._betTokenService
              .exchange4Ether(this.userAccountAddress, new BN(_amount.value), this._genericCallback.bind(this))
              .subscribe((_result) => {
                console.log(_result);
                //this._messageService.show(_result.result);
              });
          } else {
            this._messageService.show(`Quantity of Bet Tokens is not valid`);
          }
        }
      });
    });
  }

  addTokenToWallet(event: MouseEvent) {}

  private getBalance() {
    if (this.userAccountAddress) {
      this._betTokenService.balanceOf(this.userAccountAddress).subscribe((_balanceSBT) => {
        if (_balanceSBT.success == false) {
          this._messageService.show(`It was not possible to get Bet Tokens balance`);
          return;
        }
        this.formatedBalance = this._numberService.formatBNShortScale(_balanceSBT.result as BN);
        this.formatedBalanceTooltip = this._numberService.formatBN(_balanceSBT.result as BN);
        this._changeDetectorRefs.detectChanges();
      });
    }
  }

  pause() {
    this.action(Action.PAUSE);
    this._betTokenService
      .pause(this._genericCallback.bind(this))
      .subscribe((transactionResult: TransactionResult<string>) => {
        this._messageService.show(transactionResult.result);
        if (transactionResult.success) {
          this._messageService.show(transactionResult.result);
        } else {
          this.action();
        }
      });
  }

  unpause() {
    this.action(Action.UNPAUSE);
    this._betTokenService
      .unpause(this._genericCallback.bind(this))
      .subscribe((transactionResult: TransactionResult<string>) => {
        this._messageService.show(transactionResult.result);
        if (transactionResult.success) {
          this._messageService.show(transactionResult.result);
        } else {
          this.action();
        }
      });
  }

  private async action(a?: Action) {
    if (a) {
      this.currentAction = a;
      this.loading = true;
    } else {
      this.currentAction = Action.NONE;
      this.loading = false;
      this.paused = await this._betTokenService.paused();
      this._changeDetectorRefs.detectChanges();
    }
  }
}

enum Action {
  NONE = '',
  BUY = 'BUY',
  EXCHANGE = `EXCHANGE`,
  BALANCE = `BALANCE`,
  PAUSE = 'PAUSE',
  UNPAUSE = 'UNPAUSE',
}

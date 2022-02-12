import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as BN from 'bn.js';
import { BetTokenService } from 'src/app/contracts';
import { BetTokenMintedEvent as BetTokenReceivedEvent } from 'src/app/model';
import { MessageService, Web3Service } from 'src/app/services';
import { BuyDialogComponent } from '../buy-dialog/buy-dialog.component';

@Component({
  selector: 'dapp-bettoken-home',
  templateUrl: './bettoken-home.component.html',
  styleUrls: ['./bettoken-home.component.css'],
})
export class BettokenHomeComponent implements OnInit {
  userAccountAddress: string | null = null;
  balance: BN = new BN(0);

  constructor(
    private _web3Service: Web3Service,
    private _betTokenService: BetTokenService,
    private _messageService: MessageService,
    private _dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    // Subscribing for account address changes in the provider
    this._web3Service.getUserAccountAddressSubject().subscribe((address) => {
      this.userAccountAddress = address;
      this.getBalance();
    });
    try {
      // Subscribing for transfer of Ether to the BetToken contract and, consequently,
      // balance of BetTokens changes
      (
        await this._betTokenService.getEventBehaviorSubject(
          BetTokenService.EVENTS.MINTED
        )
      )?.subscribe((evt) => {
        if (evt == null) return;
        const eventData: BetTokenReceivedEvent = evt;
        this._messageService.show(
          `A transaction of ${eventData.value} tokens was confirmed`
        );
        this.getBalance();
      });
    } catch (e: any) {
      this._messageService.show(e.message);
    }
  }

  buy(event: MouseEvent) {
    if (!this.userAccountAddress) {
      this._messageService.show(
        `You have to connect your wallet in order to buy BetTokens`
      );
    } else {
      const dialogRef = this._dialog.open(BuyDialogComponent, {
        data: {
          title: `Buy BetTokens`,
        },
      });

      dialogRef.afterClosed().subscribe((_purchaseData) => {
        if (_purchaseData) {
          if (_purchaseData.value != null && this.userAccountAddress) {
            this._betTokenService
              .buy(this.userAccountAddress, new BN(_purchaseData.value))
              .subscribe((_result) => {
                this._messageService.show(_result.message);
              });
          } else {
            this._messageService.show(`Quantity of BetTokens is not valid`);
          }
        }
        console.log(`Dialog result`, _purchaseData);
      });
    }
  }

  addTokenToWallet(event: MouseEvent) {}

  private getBalance() {
    if (this.userAccountAddress) {
      this._betTokenService
        .balanceOf(this.userAccountAddress)
        .subscribe((_balance) => {
          this.balance = _balance;
        });
    }
  }
}

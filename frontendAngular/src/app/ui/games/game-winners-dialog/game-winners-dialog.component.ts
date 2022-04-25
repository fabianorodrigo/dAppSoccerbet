import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import BN from 'bn.js';
import { Bet, BetResult, TransactionResult } from 'src/app/model';
import { MessageService, NumbersService, Web3Service } from 'src/app/services';
import { GameCompound } from '../game-compound.class';

@Component({
  selector: 'dapp-game-winners-dialog',
  templateUrl: './game-winners-dialog.component.html',
  styleUrls: ['./game-winners-dialog.component.css'],
})
export class GameWinnersDialogComponent implements OnInit {
  PAID = BetResult.PAID;
  WINNER = BetResult.WINNER;
  TIED = BetResult.TIED;

  userAccountAddress: string | null = null;

  loading: boolean = false;

  displayedColumns: string[] = ['bettor', 'value', 'prize', 'action'];
  dataSource: {
    bettor: string;
    value: number;
    prize: number;
    result: BetResult | undefined;
  }[] = [];

  prize!: BN;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      gameCompound: GameCompound;
      winnerBets: Bet[];
    },
    private _numberService: NumbersService,
    private _web3Service: Web3Service,
    private _messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.dataSource = this.data.winnerBets.map((bet) => {
      return {
        bettor: bet.bettor as string,
        value: bet.value,
        prize: bet.prize,
        result: bet.result,
        gamePrizesCalculated: this.data.gameCompound.game.prizesCalculated,
      };
    });

    this.data.gameCompound.gameService.getPrize().then((value) => {
      this.prize = value;
    });

    this._web3Service.getUserAccountAddressSubject().subscribe((address) => {
      this.userAccountAddress = address;
    });
  }

  withdraw(_betIndex: number) {
    if (!this.userAccountAddress) {
      return;
    } else if (this.userAccountAddress != this.data.winnerBets[_betIndex].bettor) {
      this._messageService.show(`You can't execute withdraw of others bets`);
    } else {
      this.loading = true;
      this.data.gameCompound.gameService
        .withdrawPrize(
          this.data.gameCompound.game,
          this.data.winnerBets[_betIndex].index,
          this._genericCallback.bind(this)
        )
        .subscribe((transactionResult) => {
          this._messageService.show(transactionResult.result);
          if (transactionResult.success) {
            this.dataSource[_betIndex].result = this.PAID;
          }
        });
    }
  }

  private _genericCallback(confirmationResult: TransactionResult<string>) {
    this.loading = false;
    if (confirmationResult.success == false) {
      this._messageService.show(confirmationResult.result);
    }
  }

  format(value: BN): string {
    return this._numberService.formatBN(value);
  }
  formatShortScale(value: BN): string {
    return this._numberService.formatBNShortScale(value);
  }
}

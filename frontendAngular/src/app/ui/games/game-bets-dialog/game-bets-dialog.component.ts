import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import BN from 'bn.js';
import { Bet, BetResult } from 'src/app/model';
import { NumbersService } from 'src/app/services';
import { GameCompound } from './../game-compound.class';

@Component({
  selector: 'dapp-game-bets-dialog',
  templateUrl: './game-bets-dialog.component.html',
  styleUrls: ['./game-bets-dialog.component.css'],
})
export class GameBetsDialogComponent implements OnInit {
  displayedColumns: string[] = ['homeScore', 'X', 'visitorScore', 'value', 'bettor', `result`];
  dataSource: {
    bettor: string;
    value: number;
    homeScore: number;
    visitorScore: number;
    result: string;
  }[] = [];

  prize!: BN;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      gameCompound: GameCompound;
      homeTeam: string;
      visitorTeam: string;
      bets: Bet[];
    },
    private _numberService: NumbersService
  ) {}

  ngOnInit(): void {
    this.dataSource = this.data.bets.map((bet) => {
      return {
        bettor: bet.bettor as string,
        value: bet.value,
        homeScore: bet.score.home,
        result: this.getResult(bet.result as BetResult),
        visitorScore: bet.score.visitor,
      };
    });

    this.data.gameCompound.gameService.getPrize().then((value) => {
      this.prize = value;
    });
  }

  getResult(r: BetResult): any {
    return Object.keys(BetResult)[Object.values(BetResult).indexOf(r)];
  }

  format(value: BN): string {
    return this._numberService.formatBN(value);
  }
  formatShortScale(value: BN): string {
    return this._numberService.formatBNShortScale(value);
  }
}

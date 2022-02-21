import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import BN from 'bn.js';
import { Bet } from 'src/app/model';
import { NumbersService } from 'src/app/services';
import { GameCompound } from '../game-compound.class';

@Component({
  selector: 'dapp-game-winners-dialog',
  templateUrl: './game-winners-dialog.component.html',
  styleUrls: ['./game-winners-dialog.component.css'],
})
export class GameWinnersDialogComponent implements OnInit {
  displayedColumns: string[] = ['bettor', 'value', 'prize'];
  dataSource: {
    bettor: string;
    value: number;
    prize: number;
  }[] = [];

  prize!: BN;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      gameCompound: GameCompound;
      winnerBets: Bet[];
    },
    private _numberService: NumbersService
  ) {}

  ngOnInit(): void {
    this.dataSource = this.data.winnerBets.map((bet) => {
      return {
        bettor: bet.bettor as string,
        value: bet.value,
        prize: bet.prize,
      };
    });

    this.data.gameCompound.gameService.getPrize().then((value) => {
      this.prize = value;
    });
  }

  format(value: BN): string {
    return this._numberService.formatBN(value);
  }
  formatShortScale(value: BN): string {
    return this._numberService.formatBNShortScale(value);
  }
}

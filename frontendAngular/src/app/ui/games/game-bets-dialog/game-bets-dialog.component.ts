import { GameCompound } from './../game-compound.class';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import BN from 'bn.js';
import { GameService } from 'src/app/contracts';
import { Bet } from 'src/app/model';
import { NumbersService } from 'src/app/services';

@Component({
  selector: 'dapp-game-bets-dialog',
  templateUrl: './game-bets-dialog.component.html',
  styleUrls: ['./game-bets-dialog.component.css'],
})
export class GameBetsDialogComponent implements OnInit {
  displayedColumns: string[] = [
    'homeScore',
    'X',
    'visitorScore',
    'value',
    'bettor',
  ];
  dataSource: {
    bettor: string;
    value: number;
    homeScore: number;
    visitorScore: number;
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
        visitorScore: bet.score.visitor,
      };
    });

    this.data.gameCompound.gameService.getPrize().then((value) => {
      this.prize = value;
    });
  }

  format(value: BN): string {
    return this._numberService.formatBN(value);
  }
}

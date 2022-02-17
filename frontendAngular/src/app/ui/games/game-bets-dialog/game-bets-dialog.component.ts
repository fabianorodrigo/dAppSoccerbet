import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Bet } from 'src/app/model';

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

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { homeTeam: string; visitorTeam: string; bets: Bet[] }
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
  }
}

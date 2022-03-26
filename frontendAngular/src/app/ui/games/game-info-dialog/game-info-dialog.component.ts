import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageService, NumbersService, Web3Service } from 'src/app/services';
import { GameCompound } from '../game-compound.class';

@Component({
  selector: 'dapp-game-info-dialog',
  templateUrl: './game-info-dialog.component.html',
  styleUrls: ['./game-info-dialog.component.css'],
})
export class GameInfoDialogComponent implements OnInit {
  datetimeGame!: Date;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      gameCompound: GameCompound;
    },
    private _numberService: NumbersService
  ) {}

  ngOnInit(): void {
    this.datetimeGame = new Date(this._numberService.convertTimeChainToJS(this.data?.gameCompound?.game?.datetimeGame));
    if (!this.data?.gameCompound?.game?.owner) {
      this.data.gameCompound.gameService.owner().subscribe((owner) => {
        this.data.gameCompound.game.owner = owner;
      });
    }
  }
}

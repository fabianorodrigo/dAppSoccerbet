import { Game } from 'src/app/model/game.interface';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dapp-admin-games-home',
  templateUrl: './admin-games-home.component.html',
  styleUrls: ['./admin-games-home.component.css'],
})
export class AdminGamesHomeComponent implements OnInit {
  constructor() {}

  editing: boolean = false;

  ngOnInit(): void {}
  newGame(event: MouseEvent) {
    this.editing = true;
  }

  closeForm(game: Game | null) {
    if (game != null) {
      alert(`Olha o jogo aí gente: ${game.homeTeam} vs ${game.visitorTeam}`);
    }
    this.editing = false;
  }
}

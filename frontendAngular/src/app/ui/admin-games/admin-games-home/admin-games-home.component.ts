import { Component, OnInit } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { GameFactoryService } from 'src/app/contracts';
import { Game } from 'src/app/model/game.interface';
import { MessageService } from './../../../services';

@Component({
  selector: 'dapp-admin-games-home',
  templateUrl: './admin-games-home.component.html',
  styleUrls: ['./admin-games-home.component.css'],
})
export class AdminGamesHomeComponent implements OnInit {
  constructor(
    private gameFactory: GameFactoryService,
    private message: MessageService
  ) {}

  editing: boolean = false;
  processing: boolean = false;

  ngOnInit(): void {}
  newGame(event: MouseEvent) {
    this.editing = true;
  }

  closeForm(game: Game | null) {
    if (game != null) {
      this.processing = true;
      this.gameFactory.newGame(game).subscribe((success) => {
        this.processing = false;
        if (success) {
          this.message.show(`Transaction sent successfully`);
        } else {
          this.message.show(`The transaction wasn't sent`);
        }
      });
    }
    this.editing = false;
  }
}

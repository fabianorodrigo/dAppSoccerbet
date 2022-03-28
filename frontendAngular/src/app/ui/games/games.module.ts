import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { AdminGamesFormComponent } from './admin-games-form/admin-games-form.component';
import { GamesHomeComponent } from './games-home/games-home.component';
import { GameComponent } from './game/game.component';
import { ComponentsModule } from '../components/components.module';
import { GameBetsDialogComponent } from './game-bets-dialog/game-bets-dialog.component';
import { GameWinnersDialogComponent } from './game-winners-dialog/game-winners-dialog.component';
import { GameInfoDialogComponent } from './game-info-dialog/game-info-dialog.component';

@NgModule({
  declarations: [GamesHomeComponent, AdminGamesFormComponent, GameComponent, GameBetsDialogComponent, GameWinnersDialogComponent, GameInfoDialogComponent],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
  ],
})
export class GamesModule {}

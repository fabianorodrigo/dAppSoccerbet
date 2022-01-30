import { AdminGamesModule } from './admin-games/admin-games.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './../material.module';
import { ComponentsModule } from './components/components.module';
import { GamesComponent } from './games/games.component';
import { HomeComponent } from './home/home.component';
import { UiRoutingModule } from './ui.routes';

@NgModule({
  declarations: [HomeComponent, GamesComponent],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    UiRoutingModule,
    ComponentsModule,
    AdminGamesModule,
  ],
  exports: [ComponentsModule],
})
export class UiModule {}

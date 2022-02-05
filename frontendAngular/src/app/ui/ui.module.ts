import { GamesModule } from './games/games.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './../material.module';
import { ComponentsModule } from './components/components.module';
import { HomeComponent } from './home/home.component';
import { UiRoutingModule } from './ui.routes';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    UiRoutingModule,
    ComponentsModule,
    GamesModule,
  ],
  //snackbar global default options
  providers: [
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3500 } },
  ],
  exports: [ComponentsModule],
})
export class UiModule {}

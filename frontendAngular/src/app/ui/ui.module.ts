import { ComponentsModule } from './components/components.module';
import { UiRoutingModule } from './ui.routes';
import { MaterialModule } from './../material.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ErrorComponent } from './components/error/error.component';
import { AdminComponent } from './admin/admin.component';
import { GamesComponent } from './games/games.component';

@NgModule({
  declarations: [HomeComponent, AdminComponent, GamesComponent],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    UiRoutingModule,
    ComponentsModule,
  ],
  exports: [ComponentsModule],
})
export class UiModule {}

import { UiRoutingModule } from './ui.routes';
import { MaterialModule } from './../material.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ErrorComponent } from './error/error.component';

@NgModule({
  declarations: [HeaderComponent, HomeComponent, ErrorComponent],
  imports: [CommonModule, RouterModule, MaterialModule, UiRoutingModule],
  exports: [HeaderComponent],
})
export class UiModule {}

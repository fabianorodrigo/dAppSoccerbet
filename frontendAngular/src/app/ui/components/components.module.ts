import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { ErrorComponent } from './error/error.component';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { UiRoutingModule } from '../ui.routes';
import { WalletComponent } from './wallet/wallet.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [HeaderComponent, ErrorComponent, WalletComponent],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    UiRoutingModule,
    FlexLayoutModule,
  ],
  exports: [HeaderComponent, WalletComponent],
})
export class ComponentsModule {}

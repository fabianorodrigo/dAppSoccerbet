import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { UiRoutingModule } from '../ui.routes';
import { ErrorComponent } from './error/error.component';
import { HeaderComponent } from './header/header.component';
import { LayoutComponent } from './layout/layout.component';
import { MenuComponent } from './menu/menu.component';
import { WalletComponent } from './wallet/wallet.component';

@NgModule({
  declarations: [
    HeaderComponent,
    ErrorComponent,
    WalletComponent,
    MenuComponent,
    LayoutComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    UiRoutingModule,
    FlexLayoutModule,
  ],
  exports: [HeaderComponent, WalletComponent, MenuComponent, LayoutComponent],
})
export class ComponentsModule {}

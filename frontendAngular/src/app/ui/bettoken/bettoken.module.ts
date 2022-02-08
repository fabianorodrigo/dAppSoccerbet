import { MatFormFieldModule } from '@angular/material/form-field';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BettokenHomeComponent } from './bettoken-home/bettoken-home.component';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BuyDialogComponent } from './buy-dialog/buy-dialog.component';

@NgModule({
  declarations: [BettokenHomeComponent, BuyDialogComponent],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
})
export class BettokenModule {}

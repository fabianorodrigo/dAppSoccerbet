import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'src/app/material.module';
import { GamesModule } from '../games.module';

import { BetDialogComponent } from './bet-dialog.component';

describe('BetDialogComponent', () => {
  let component: BetDialogComponent;
  let fixture: ComponentFixture<BetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BetDialogComponent],
      imports: [MaterialModule, GamesModule, BrowserAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

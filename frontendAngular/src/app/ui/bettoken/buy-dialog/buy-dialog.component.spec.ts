import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'src/app/material.module';
import { GamesModule } from '../../games/games.module';
import { BuyDialogComponent } from './buy-dialog.component';

describe('BuyDialogComponent', () => {
  let component: BuyDialogComponent;
  let fixture: ComponentFixture<BuyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BuyDialogComponent],
      imports: [MaterialModule, GamesModule, BrowserAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

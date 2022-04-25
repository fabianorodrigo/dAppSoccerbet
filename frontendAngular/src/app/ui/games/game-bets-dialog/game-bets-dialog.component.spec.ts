import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { GamesModule } from '../games.module';
import { GameBetsDialogComponent } from './game-bets-dialog.component';

const mockDialogData = {
  gameCompound: {
    gameService: {
      getPrize: () =>
        new Promise((resolve, reject) => {
          resolve(10);
        }),
    },
  },
  bets: [],
};

describe('GameBetsDialogComponent', () => {
  let component: GameBetsDialogComponent;
  let fixture: ComponentFixture<GameBetsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameBetsDialogComponent],
      imports: [GamesModule, MaterialModule, MatDialogModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: mockDialogData,
        },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameBetsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

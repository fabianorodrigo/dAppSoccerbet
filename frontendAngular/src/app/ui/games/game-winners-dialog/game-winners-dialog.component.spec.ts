import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { GamesModule } from '../games.module';

import { GameWinnersDialogComponent } from './game-winners-dialog.component';

describe('GameWinnersDialogComponent', () => {
  let component: GameWinnersDialogComponent;
  let fixture: ComponentFixture<GameWinnersDialogComponent>;

  const mockDialogData = {
    gameCompound: {
      gameService: {
        getPrize: () =>
          new Promise((resolve, reject) => {
            resolve(10);
          }),
      },
    },
    winnerBets: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameWinnersDialogComponent],
      imports: [MaterialModule, GamesModule],
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
    fixture = TestBed.createComponent(GameWinnersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

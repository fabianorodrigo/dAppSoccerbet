import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { GamesModule } from '../games.module';

import { GameInfoDialogComponent } from './game-info-dialog.component';

describe('GameInfoDialogComponent', () => {
  let component: GameInfoDialogComponent;
  let fixture: ComponentFixture<GameInfoDialogComponent>;

  const mockDialogData = {
    gameCompound: {
      game: {},
      gameService: {
        owner: () => {
          return new Observable<string>((_subscriber) => {
            _subscriber.next(`0x0`);
          });
        },
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameInfoDialogComponent],
      imports: [GamesModule, MatDialogModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

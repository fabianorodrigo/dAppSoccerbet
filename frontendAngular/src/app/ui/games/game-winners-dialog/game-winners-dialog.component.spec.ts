import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameWinnersDialogComponent } from './game-winners-dialog.component';

describe('GameWinnersDialogComponent', () => {
  let component: GameWinnersDialogComponent;
  let fixture: ComponentFixture<GameWinnersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameWinnersDialogComponent ]
    })
    .compileComponents();
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

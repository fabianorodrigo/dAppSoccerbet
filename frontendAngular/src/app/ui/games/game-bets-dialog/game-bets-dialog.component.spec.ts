import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameBetsDialogComponent } from './game-bets-dialog.component';

describe('GameBetsDialogComponent', () => {
  let component: GameBetsDialogComponent;
  let fixture: ComponentFixture<GameBetsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameBetsDialogComponent ]
    })
    .compileComponents();
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

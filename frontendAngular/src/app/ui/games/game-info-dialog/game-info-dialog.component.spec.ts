import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameInfoDialogComponent } from './game-info-dialog.component';

describe('GameInfoDialogComponent', () => {
  let component: GameInfoDialogComponent;
  let fixture: ComponentFixture<GameInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameInfoDialogComponent ]
    })
    .compileComponents();
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

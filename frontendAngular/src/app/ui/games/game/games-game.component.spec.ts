import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesGameComponent } from './games-game.component';

describe('GamesGameComponent', () => {
  let component: GamesGameComponent;
  let fixture: ComponentFixture<GamesGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GamesGameComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamesGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

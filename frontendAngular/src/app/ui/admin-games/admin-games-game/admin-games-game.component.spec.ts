import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGamesGameComponent } from './admin-games-game.component';

describe('AdminGamesGameComponent', () => {
  let component: AdminGamesGameComponent;
  let fixture: ComponentFixture<AdminGamesGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminGamesGameComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminGamesGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

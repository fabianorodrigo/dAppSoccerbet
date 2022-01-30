import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGamesHomeComponent } from './admin-games-home.component';

describe('AdminGamesHomeComponent', () => {
  let component: AdminGamesHomeComponent;
  let fixture: ComponentFixture<AdminGamesHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminGamesHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminGamesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

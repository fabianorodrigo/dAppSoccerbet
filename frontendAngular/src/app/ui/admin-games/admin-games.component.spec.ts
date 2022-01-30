import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGamesComponent } from './admin-games.component';

describe('AdminComponent', () => {
  let component: AdminGamesComponent;
  let fixture: ComponentFixture<AdminGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminGamesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

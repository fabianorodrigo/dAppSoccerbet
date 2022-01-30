import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGamesFormComponent } from './admin-games-form.component';

describe('AdminGamesFormComponent', () => {
  let component: AdminGamesFormComponent;
  let fixture: ComponentFixture<AdminGamesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminGamesFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminGamesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

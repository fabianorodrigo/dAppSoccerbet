import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GamesModule } from '../games.module';

import { AdminGamesFormComponent } from './admin-games-form.component';

describe('AdminGamesFormComponent', () => {
  let component: AdminGamesFormComponent;
  let fixture: ComponentFixture<AdminGamesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminGamesFormComponent],
      imports: [GamesModule, BrowserAnimationsModule],
    }).compileComponents();
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

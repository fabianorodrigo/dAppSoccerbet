import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesHomeComponent } from './games-home.component';

describe('GamesHomeComponent', () => {
  let component: GamesHomeComponent;
  let fixture: ComponentFixture<GamesHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GamesHomeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BettokenHomeComponent } from './bettoken-home.component';

describe('BettokenHomeComponent', () => {
  let component: BettokenHomeComponent;
  let fixture: ComponentFixture<BettokenHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BettokenHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BettokenHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

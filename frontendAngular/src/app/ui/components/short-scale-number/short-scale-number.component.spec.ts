import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortScaleNumberComponent } from './short-scale-number.component';

describe('ShortScaleNumberComponent', () => {
  let component: ShortScaleNumberComponent;
  let fixture: ComponentFixture<ShortScaleNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShortScaleNumberComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortScaleNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

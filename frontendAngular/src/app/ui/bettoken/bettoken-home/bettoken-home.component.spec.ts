import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BettokenModule } from '../bettoken.module';

import { BettokenHomeComponent } from './bettoken-home.component';

describe(BettokenHomeComponent.name, () => {
  //O ComponentFixture é um Wrapper com utilitários para facilitar os testes
  let component: BettokenHomeComponent;
  let fixture: ComponentFixture<BettokenHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BettokenHomeComponent],
      imports: [BettokenModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BettokenHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // se não criou direito, vai retornar null.
    // com o toBeTruthy, o null é considerado false
    expect(component).toBeTruthy();
  });
});

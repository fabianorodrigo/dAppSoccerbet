import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MaterialModule } from '../material.module';
import { MessageService } from '../services';

import { GameFactoryService } from './game-factory.service';

describe('GameFactoryService', () => {
  let service: GameFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, MatSnackBarModule],
      providers: [MessageService],
    });
    service = TestBed.inject(GameFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

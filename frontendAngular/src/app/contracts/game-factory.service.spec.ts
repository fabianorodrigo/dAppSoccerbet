import { TestBed } from '@angular/core/testing';

import { GameFactoryService } from './game-factory.service';

describe('GameFactoryService', () => {
  let service: GameFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

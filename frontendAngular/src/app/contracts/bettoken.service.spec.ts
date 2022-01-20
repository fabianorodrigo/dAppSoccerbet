import { TestBed } from '@angular/core/testing';

import { BetTokenService } from './bettoken.service';

describe('BettokenService', () => {
  let service: BetTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BetTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MaterialModule } from '../material.module';
import { MessageService } from '../services';

import { BetTokenService } from './bettoken.service';

describe('BettokenService', () => {
  let service: BetTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, MatSnackBarModule],
      providers: [MessageService],
    });
    service = TestBed.inject(BetTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

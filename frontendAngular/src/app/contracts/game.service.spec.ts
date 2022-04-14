import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MaterialModule } from '../material.module';
import { MessageService, Web3Service } from '../services';

import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, MatSnackBarModule],
      providers: [MessageService],
    });
    const _messageService = TestBed.inject(MessageService);
    const _web3Service = TestBed.inject(Web3Service);
    service = new GameService(_messageService, _web3Service, `0x0`);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

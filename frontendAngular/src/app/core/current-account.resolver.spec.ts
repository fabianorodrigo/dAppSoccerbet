import { TestBed } from '@angular/core/testing';

import { CurrentAccountResolver } from './current-account.resolver';

describe('CurrentAccountResolver', () => {
  let resolver: CurrentAccountResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(CurrentAccountResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});

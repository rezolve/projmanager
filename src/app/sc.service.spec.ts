import { TestBed } from '@angular/core/testing';

import { ScService } from './sc.service';

describe('ScService', () => {
  let service: ScService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

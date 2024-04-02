import { TestBed } from '@angular/core/testing';

import { GooglePayService } from './google-pay.service';

describe('GooglePayService', () => {
  let service: GooglePayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GooglePayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

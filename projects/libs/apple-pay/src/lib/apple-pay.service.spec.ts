import { TestBed } from '@angular/core/testing';

import { ApplePayService } from './apple-pay.service';

describe('ApplePayService', () => {
  let service: ApplePayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplePayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

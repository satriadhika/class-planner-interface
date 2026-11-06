import { TestBed } from '@angular/core/testing';
import { GoogleIdentity } from './google-identity';

describe('GoogleIdentity', () => {
  let service: GoogleIdentity;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleIdentity);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

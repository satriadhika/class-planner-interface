import { TestBed } from '@angular/core/testing';
import { Problems } from './problems';

describe('Problems', () => {
  let service: Problems;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Problems);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

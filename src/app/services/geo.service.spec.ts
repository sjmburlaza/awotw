import { TestBed } from '@angular/core/testing';

import { Geo } from './geo.service';

describe('Geo', () => {
  let service: Geo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Geo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

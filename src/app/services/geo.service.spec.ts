import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { GeoService } from './geo.service';

describe('GeoService', () => {
  let service: GeoService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GeoService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads the GeoJSON countries feed', () => {
    const mockFeatureCollection = { type: 'FeatureCollection', features: [] };
    let response: unknown;

    service.getCountries().subscribe((res) => {
      response = res;
    });

    const req = httpTesting.expectOne(
      'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',
    );
    expect(req.request.method).toBe('GET');

    req.flush(mockFeatureCollection);
    expect(response).toEqual(mockFeatureCollection);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';

import { DataService } from './data.service';

describe('Data', () => {
  let service: DataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it.each([
    ['getWonders', 'assets/json/wonders.json'],
    ['getTallestBuildings', 'assets/json/tallestBuildings.json'],
    ['getMostVisited', 'assets/json/mostVisited.json'],
    ['getStylesTimeline', 'assets/json/stylesTimeline.json'],
  ] as const)('loads %s from %s', (methodName, expectedUrl) => {
    const mockResponse = [{ name: 'Test item' }];
    let response: unknown;
    const request$ = service[methodName]() as Observable<unknown>;

    request$.subscribe((res) => {
      response = res;
    });

    const req = httpTesting.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
    expect(response).toEqual(mockResponse);
  });
});

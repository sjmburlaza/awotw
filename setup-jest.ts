import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { of } from 'rxjs';

setupZoneTestEnv();

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          fragment: of(null),
          queryParamMap: of(convertToParamMap({})),
          paramMap: of(convertToParamMap({})),
          snapshot: {
            paramMap: convertToParamMap({}),
            queryParamMap: convertToParamMap({}),
          },
        },
      },
    ],
  });
});

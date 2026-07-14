import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs';
import { LoaderService } from './loader.service';

describe('LoadingService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts in the loading state', () => {
    service.isLoading$.pipe(take(1)).subscribe((isLoading) => {
      expect(isLoading).toBe(true);
    });
  });
});

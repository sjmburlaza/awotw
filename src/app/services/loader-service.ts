import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  setLoading(isLoading: boolean): void {
    this.isLoadingSubject.next(isLoading);
  }
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  isloading$ = new Subject<boolean>();

  isLoading(isLoading: boolean) { 
    this.isloading$.next(isLoading); 
  }
}

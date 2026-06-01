import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GroupingComponent } from 'src/app/shared/components/grouping/grouping';
import { DataService, Group } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { groupByAttribute, sortAlphabetical } from 'src/app/shared/utils-helper';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-location',
  imports: [GroupingComponent, AsyncPipe],
  templateUrl: './location.html',
  styleUrl: './location.scss',
})
export class LocationComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly scrollService = inject(ScrollService);
  private readonly destroyRef = inject(DestroyRef);

  groups$: Observable<Group[]> = of([]);
  title = 'Grouping by Continent';
  errorMessage = '';

  ngOnInit(): void {
    this.groups$ = this.dataService.getWonders().pipe(
      tap(() => (this.errorMessage = '')),
      map((items) => groupByAttribute(sortAlphabetical([...items], 'continent'), 'continent')),
      catchError(() => {
        this.errorMessage = 'Unable to load location groups.';
        return of([]);
      }),
    );

    this.activatedRoute.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fragment: string | null) => {
        if (fragment) this.scrollService.scrollToFragment(fragment, 50);
      });
  }
}

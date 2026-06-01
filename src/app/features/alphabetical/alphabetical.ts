import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { DataService, Group } from 'src/app/services/data.service';
import { ScrollService } from 'src/app/services/scroll.service';
import { GroupingComponent } from 'src/app/shared/components/grouping/grouping';
import { groupByAttribute, sortAlphabetical } from 'src/app/shared/utils-helper';

@Component({
  selector: 'app-alphabetical',
  imports: [GroupingComponent, AsyncPipe],
  templateUrl: './alphabetical.html',
  styleUrl: './alphabetical.scss',
})
export class AlphabeticalComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly scrollService = inject(ScrollService);
  private readonly destroyRef = inject(DestroyRef);

  groups$: Observable<Group[]> = of([]);
  title = 'Alphabetical Grouping';
  errorMessage = '';

  ngOnInit(): void {
    this.groups$ = this.dataService.getWonders().pipe(
      tap(() => (this.errorMessage = '')),
      map((items) => groupByAttribute(sortAlphabetical([...items], 'name'), 'name')),
      catchError(() => {
        this.errorMessage = 'Unable to load alphabetical groups.';
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

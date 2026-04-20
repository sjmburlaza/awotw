import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
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

  groups$: Observable<Group[]> = of([]);
  title = 'Alphabetical Grouping';

  ngOnInit(): void {
    this.groups$ = this.dataService.getWonders().pipe(
      map((items) => groupByAttribute(sortAlphabetical([...items], 'name'), 'name')),
      catchError(() => of([])),
    );

    this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.scrollService.scrollToFragment(fragment, 50);
    });
  }
}
